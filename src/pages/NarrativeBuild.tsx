import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { saveVocationalStatement } from '@/utils/dbUtils';
import { v4 as uuidv4 } from 'uuid';
import { VocationAvatarModal } from '@/components/VocationAvatarModal';
import { VocationalStatementDialog } from '@/components/VocationalStatementDialog';
import { ArrowLeft } from 'lucide-react';
import { UIVocationalStatement as ImportedUIVocationalStatement, AvatarRole } from '@/types/NarrativeTypes';
import { ChurchAvatarModal } from '@/components/ChurchAvatarModal';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AvatarProvider, useAvatarContext } from '@/hooks/useAvatarContext';
import { useNarrativeAvatar, ChurchAvatar, Companion } from '@/hooks/useNarrativeAvatar';
import { ExtendedUser } from '@/types/UserTypes';

import { useNarrativeBuildConversation } from '@/hooks/useNarrativeBuildConversation';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts, Prompt } from '@/hooks/usePrompts';
import { useVocationalStatements, VocationalStatement as HookVocationalStatement } from '@/hooks/useVocationalStatements';
import { populatePrompt } from '@/utils/promptUtils';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EditVocationalStatementModal } from '@/components/narrative-build/EditVocationalStatementModal';
import { EnhancedNarrativeConversation } from '@/components/narrative-build/EnhancedNarrativeConversation';
import { NarrativeMessageInput } from '@/components/narrative-build/NarrativeMessageInput';
import { ChurchAvatarCard } from '@/components/ChurchAvatarCard';
import { Loader2 } from 'lucide-react';

// ----- LocalStorage keys (consolidated) -----
const LS = {
  RESEARCH_SUMMARY: 'research_summary',
  AVAILABLE_AVATARS: 'available_avatars',
  VOCATIONAL_STATEMENT: 'vocational_statement',
} as const;

// Define PromptType correctly
type PromptType = typeof import('@/utils/promptUtils').REQUIRED_PROMPT_TYPES[number];

// Use the imported UIVocationalStatement and add additional properties
type UIVocationalStatement = ImportedUIVocationalStatement & {
  isSelected?: boolean;
  key_insights?: string[];
  counter_arguments?: string[];
  supporting_scriptures?: string[];
  rank?: number; // optional ranking if present
};

// Type for data coming from VocationalStatementDialog
type StatementDataFromDialog = UIVocationalStatement & {
  mission_statement?: string;
  contextual_explanation?: string;
  theological_justification?: string;
  practical_application?: string;
};

// Generate stable ID based on role and content
const stableId = (role: string, s: { id?: string; name?: string; mission_statement?: string; content?: string }) => {
  if (s.id) return s.id;
  const base = `${role}|${s.name ?? ''}|${s.mission_statement ?? ''}|${s.content ?? ''}`;
  // Simple hash function for stable IDs
  let h = 0; 
  for (let i = 0; i < base.length; i++) {
    h = (h * 31 + base.charCodeAt(i)) | 0;
  }
  return `stmt_${role}_${Math.abs(h)}`;
};

// Normalize statements to a consistent shape
function normalizeStatement(s: Partial<HookVocationalStatement>, role?: string): HookVocationalStatement {
  const name = s.name ?? s.mission_statement ?? 'Untitled Statement';
  const content = s.content ?? s.contextual_explanation ?? s.mission_statement ?? '';
  return {
    id: s.id ?? (role ? stableId(role, s) : `stmt_${Date.now()}_${Math.random()}`),
    name,
    content,
    createdAt: s.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resourceType: 'narrative_statement',
    category: 'narrative',
    avatar_role: (s.avatar_role as any) ?? 'system',
    mission_statement: s.mission_statement ?? '',
    contextual_explanation: s.contextual_explanation ?? '',
    theological_justification: s.theological_justification ?? '',
    practical_application: s.practical_application ?? '',
    original_ids: s.original_ids ?? [],
    user_id: s.user_id,
    key_insights: s.key_insights,
    counter_arguments: s.counter_arguments,
    supporting_scriptures: s.supporting_scriptures,
  };
}

const NarrativeBuildContent: React.FC = () => {
  // --- Missing Requirements Modal State ---
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user as ExtendedUser;

  // Avatar / companions
  const {
    churchAvatar: selectedChurchAvatar,
    companions,
    selectCompanion,
    selectedCompanionId,
  } = useNarrativeAvatar();

  const selectedCompanion = useMemo(() => {
    return companions.find(c => c.id === selectedCompanionId) || null;
  }, [companions, selectedCompanionId]);

  const { isLoading: avatarsLoading, missingAvatars } = useAvatarContext();

  // Check for missing requirements (research summary only)
  useEffect(() => {
    const checkResearchSummary = async () => {
      const missing: string[] = [];
      const localStorageSummary = localStorage.getItem(LS.RESEARCH_SUMMARY);

      if (!localStorageSummary) {
        try {
          const { data, error } = await supabase
            .from('resource_library')
            .select('content')
            .eq('resource_type', 'research_summary')
            .order('created_at', { ascending: false })
            .limit(1);

          if (error || !data || data.length === 0 || !data[0].content) {
            missing.push('Research summary');
          }
        } catch {
          missing.push('Research summary');
        }
      }

      setMissingRequirements(missing);
      setShowMissingModal(missing.length > 0);
    };

    checkResearchSummary();
  }, []);

  // State
  const [selectedStatements, setSelectedStatements] = useState<UIVocationalStatement[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [selectedViewStatement, setSelectedViewStatement] = useState<UIVocationalStatement | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showVocationalDialog, setShowVocationalDialog] = useState(false);
  const [editingStatement, setEditingStatement] = useState<UIVocationalStatement | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'adapt'>('add');
  const [dialogAvatarRole, setDialogAvatarRole] = useState<AvatarRole>('church');
  const [isSynthesizingForEdit, setIsSynthesizingForEdit] = useState(false);

  // New Edit Vocational Statement flow
  const [showEditVocationalModal, setShowEditVocationalModal] = useState(false);
  const [editingVocationalContent, setEditingVocationalContent] = useState('');
  const [isSavingEditedVocationalStatement, setIsSavingEditedVocationalStatement] = useState(false);

  // Event listener for custom event from EnhancedNarrativeConversation
  useEffect(() => {
    const handleOpenEditVocationalStatementModal = (event: CustomEvent) => {
      const statement = event.detail?.statement;
      if (statement) {
        setEditingVocationalContent(statement);
        setShowEditVocationalModal(true);
      }
    };
    window.addEventListener('openEditVocationalStatementModal', handleOpenEditVocationalStatementModal as EventListener);
    return () => {
      window.removeEventListener('openEditVocationalStatementModal', handleOpenEditVocationalStatementModal as EventListener);
    };
  }, []);

  const { selectChurchAvatar } = useNarrativeAvatar();

  const [isSynthesizingStatement, setIsSynthesizingStatement] = useState(false);
  const [isDiscussingStatements, setIsDiscussingStatements] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [hasInitiatedDiscussion, setHasInitiatedDiscussion] = useState(false);

  // Conversation hooks
  const {
    messages: rawMessages,
    isLoading: isNarrativeLoading,
    sendMessage,
    setMessages: setRawMessages,
    initializeConversation
  } = useNarrativeBuildConversation();

  const narrativeMessages = useMemo(() => {
    // Only show messages if conversation has been started by "Refine Statements" button
    if (!conversationStarted) {
      return [];
    }
    
    // Filter out system messages and the initial "kick off" message
    const filteredRawMessages = rawMessages.filter((msg, index) => {
      // Skip system messages
      if (msg.role === 'system') return false;
      
      // Skip the initial "kick off" message (usually the first user message)
      if (msg.role === 'user' && msg.content.includes('Kick off the conversation')) return false;
      
      return true;
    });
    
    return filteredRawMessages.map((msg, index) => ({
      id: `msg-${index}`,
      content: msg.content,
      role: msg.role === 'assistant' ? 'companion' : msg.role === 'system' ? 'system' : 'user' as AvatarRole,
      name: msg.role === 'assistant' ? 
        ((selectedCompanion as any)?.companion || selectedCompanion?.name || 'Companion') : 
        msg.role === 'system' ? 'System' : 'You',
      avatarUrl: msg.role === 'assistant' ? 
        (selectedCompanion?.avatar_url || '/avatars/companion.png') : 
        undefined,
      timestamp: new Date(),
      selected: false
    }));
  }, [rawMessages, selectedCompanion, conversationStarted]);

  const [userInput, setUserInput] = useState('');

  const handleUserMessageSubmit = useCallback(async (message: string) => {
    if (!message.trim()) return;
    await sendMessage(message);
    setUserInput('');
  }, [sendMessage]);

  const addMessage = useCallback(() => {
    // no-op; useConversationMessages manages messages
  }, []);

  const narrativeError = null;

  const { generateResponse } = useOpenAI();
  const { getPromptByType: getPromptFromPromptsHook } = usePrompts();
  const getPromptByTypeStrong = getPromptFromPromptsHook as (type: PromptType) => Promise<{ success: boolean; data?: Prompt; error?: any; }>;

  const churchVocationalHook = useVocationalStatements('church');
  const companionVocationalHook = useVocationalStatements('companion');
  const systemVocationalHook = useVocationalStatements('system');

  const getHookForRole = (role: AvatarRole | 'system') => {
    switch (role) {
      case 'church': return churchVocationalHook;
      case 'companion': return companionVocationalHook;
      case 'system': return systemVocationalHook;
      default:
        console.warn(`[NarrativeBuild] Unknown role passed to getHookForRole: ${role}. Defaulting to system hook.`);
        return systemVocationalHook;
    }
  };

  const [researchSummary, setResearchSummary] = useState<string>('');
  const { prompts } = usePrompts();

  // Load research summary (LS → DB)
  useEffect(() => {
    const fetchAndSetResearchSummary = async () => {
      let summary = localStorage.getItem(LS.RESEARCH_SUMMARY);

      if (!summary) {
        try {
          const { data, error } = await supabase
            .from('resource_library')
            .select('content')
            .eq('resource_type', 'research_summary')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data?.content) {
            summary = data.content;
            localStorage.setItem(LS.RESEARCH_SUMMARY, summary ?? '');
          }
        } catch (e) {
          toast({
            title: 'Error accessing research summary',
            description: 'An unexpected error occurred while fetching from database.',
            variant: 'destructive',
          });
        }
      }
      setResearchSummary(summary ?? '');
    };

    fetchAndSetResearchSummary();
  }, []);

  const mapHookStatementsToUI = useCallback((
    statements: HookVocationalStatement[],
    role: 'church' | 'companion' | 'system',
    currentSelected: UIVocationalStatement[]
  ): UIVocationalStatement[] => {
    if (statements.length === 0) return [];
    return statements.map((s) => {
      const id = stableId(role, s);
      const name = s.name || s.mission_statement || 'Untitled Statement';
      const content = s.content || [s.mission_statement, s.contextual_explanation, s.theological_justification, s.practical_application].filter(Boolean).join('\n\n') || 'No content provided.';

      const uiStatement: UIVocationalStatement = {
        id,
        name,
        content,
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
        resourceType: s.resourceType || 'narrative_statement',
        category: s.category || 'narrative',
        user_id: s.user_id || currentUser?.id,
        original_ids: s.original_ids || [],
        mission_statement: s.mission_statement || '',
        contextual_explanation: s.contextual_explanation || '',
        theological_justification: s.theological_justification || '',
        practical_application: s.practical_application || '',
        avatar_role: role,
        avatar_name:
          role === 'church' ? selectedChurchAvatar?.name :
          role === 'companion' ? selectedCompanion?.name :
          'System',
        avatar_url:
          role === 'church' ? (selectedChurchAvatar?.avatar_url || selectedChurchAvatar?.image_url) :
          role === 'companion' ? selectedCompanion?.avatar_url :
          undefined,
        isSelected: currentSelected.some(sel => sel.id === id),
        key_insights: s.key_insights,
        counter_arguments: s.counter_arguments,
        supporting_scriptures: s.supporting_scriptures,
      };
      return uiStatement;
    });
  }, [selectedChurchAvatar, selectedCompanion]);

  const generateAdaptedStatement = useCallback(async (
    originalStatement: UIVocationalStatement,
    newData: StatementDataFromDialog,
    context?: string
  ): Promise<Partial<HookVocationalStatement>> => {
    const promptResult = await getPromptByTypeStrong('scenario_adaptation' as PromptType); // keeping name, but no scenario id used
    if (!promptResult.success || !promptResult.data) {
      toast({ title: 'Error', description: 'Failed to load adaptation prompt.', variant: 'destructive' });
      throw new Error('Failed to load adaptation prompt.');
    }
    const promptTemplate = promptResult.data.prompt;

    if (typeof promptTemplate !== 'string') {
      toast({ title: 'Error', description: 'Adaptation prompt template is invalid.', variant: 'destructive' });
      throw new Error('Adaptation prompt template is invalid.');
    }

    const populatedPrompt = promptTemplate
      .replace('$(original_statement_content)', originalStatement.content || '')
      .replace('$(original_mission_statement)', originalStatement.mission_statement || originalStatement.name || '')
      .replace('$(adaptation_request_details)', newData.content || newData.mission_statement || 'Adapt based on new input.')
      .replace('$(contextual_summary)', context || '');

    const aiResponse = await generateResponse({
      messages: [{ role: 'user', content: populatedPrompt }],
      maxTokens: 800,
    });

    if (aiResponse.error || !aiResponse.text) {
      toast({ title: 'Error', description: 'AI failed to adapt the statement.', variant: 'destructive' });
      throw new Error(aiResponse.error || 'AI adaptation failed.');
    }

    return {
      mission_statement: aiResponse.text,
    };
  }, [getPromptByTypeStrong, generateResponse, toast]);

  const handleSaveVocationalStatement = useCallback(async (statementData: StatementDataFromDialog, mode: 'add' | 'edit' | 'adapt', originalStatement?: UIVocationalStatement) => {
    const rawAvatarRole = statementData.avatar_role || dialogAvatarRole || 'system';
    let effectiveAvatarRole: 'church' | 'companion' | 'system';
    switch (rawAvatarRole) {
      case 'church':
      case 'companion':
      case 'system':
        effectiveAvatarRole = rawAvatarRole;
        break;
      default:
        effectiveAvatarRole = 'system';
        break;
    }

    const hookToUse = getHookForRole(effectiveAvatarRole);

    if (mode === 'edit' && editingStatement?.id) {
      const statementToUpdate = normalizeStatement({
        ...editingStatement,
        ...statementData,
        id: editingStatement.id,
        avatar_role: effectiveAvatarRole,
        updatedAt: new Date().toISOString(),
        resourceType: 'narrative_statement',
        category: 'narrative',
        user_id: currentUser?.id || editingStatement.user_id,
      });
      hookToUse.updateStatement(statementToUpdate);
      toast({ title: 'Statement Updated', description: `Vocational statement for ${effectiveAvatarRole} updated.` });
      setShowVocationalDialog(false);
      setEditingStatement(null);
      return;
    }

    if (mode === 'add') {
      const statementToAdd = normalizeStatement({
        ...statementData,
        id: uuidv4(),
        avatar_role: effectiveAvatarRole,
        user_id: currentUser?.id,
      });
      hookToUse.addStatement(statementToAdd);
      toast({ title: 'Statement Added', description: `New vocational statement for ${effectiveAvatarRole} added.` });
      setShowVocationalDialog(false);
      setEditingStatement(null);
      return;
    }

    if (mode === 'adapt' && originalStatement) {
      setIsSynthesizingStatement(true);
      const adaptedStatement = await generateAdaptedStatement(originalStatement, statementData, researchSummary);
      setIsSynthesizingStatement(false);
      if (adaptedStatement) {
        const statementToUpdate = normalizeStatement({
          ...originalStatement,
          ...adaptedStatement,
          avatar_role: effectiveAvatarRole,
          updatedAt: new Date().toISOString(),
        });

        // if AI returned mission_statement only, set name/content from it
        if (adaptedStatement.mission_statement) {
          statementToUpdate.name = adaptedStatement.mission_statement;
          statementToUpdate.content = adaptedStatement.mission_statement;
        }

        hookToUse.updateStatement(statementToUpdate);
        toast({ title: 'Statement Adapted', description: `Vocational statement for ${effectiveAvatarRole} adapted and updated.` });
        setShowVocationalDialog(false);
        setEditingStatement(null);
      }
      return;
    }

    toast({ title: 'Save Error', description: 'Invalid mode or missing data.', variant: 'destructive' });
  }, [currentUser, editingStatement, dialogAvatarRole, getHookForRole, generateAdaptedStatement]);

  // Guard to prevent duplicate initiation
  const initiatingDiscussionRef = useRef(false);

  const handleInitiateMultiStatementDiscussion = useCallback(async (): Promise<void> => {
    if (selectedStatements.length === 0) {
      toast({
        title: 'No Statements Selected',
        description: 'Please select one or more statements to discuss.',
        variant: 'default',
      });
      return;
    }
    if (hasInitiatedDiscussion || initiatingDiscussionRef.current) return;

    initiatingDiscussionRef.current = true;
    setIsDiscussingStatements(true);

    try {
      const statementCount = selectedStatements.length;
      
      if (statementCount === 1) {
        // Single statement: Pass to conversation interface and generate message using narrative_response
        const statement = selectedStatements[0];
        const statementContent = statement.content || statement.mission_statement || 'Untitled Statement';
        
        // Get narrative_build_companion prompt for subsequent conversations
        const narrativePromptResult = await getPromptByTypeStrong('narrative_build_companion');
        if (!narrativePromptResult.success || !narrativePromptResult.data) {
          throw new Error('Failed to load narrative_build_companion prompt');
        }
        
        // Prepare parameters for the narrative prompt
        const parameters = {
          selected_statement: statementContent,
          companion_name: (selectedCompanion as any)?.companion || selectedCompanion?.name || 'Companion',
          research_summary: researchSummary || 'No research summary available'
        };
        
        // Populate the prompt
        const populatedPrompt = populatePrompt(narrativePromptResult.data.prompt, parameters);
        
        // Generate AI response
        const { error: genErr, text } = await generateResponse({
          messages: [{ role: 'user', content: populatedPrompt }],
          maxTokens: 1000,
          temperature: 0.7
        });
        
        if (genErr) {
          throw new Error(genErr);
        }
        
        // Set conversation started flag and add the AI response to the conversation
        setConversationStarted(true);
        await sendMessage(`I'd like to refine this statement: "${statementContent}"`);
        
      } else {
        // Multiple statements: Send to OpenAI for synthesis using vocational_statement_synthesized_multiple
        const promptType: PromptType = 'vocational_statement_synthesized_multiple';
        const promptResult = await getPromptByTypeStrong(promptType);
        
        if (!promptResult.success || !promptResult.data) {
          throw new Error(`Failed to load ${promptType} prompt`);
        }
        
        // Compile statements for synthesis
        const compiledStatementsContent = selectedStatements
          .map(stmt => stmt.content || stmt.mission_statement || JSON.stringify(stmt))
          .join('\n\n---\n\n');
        
        // Prepare parameters for synthesis
        const parameters = {
          compiled_statements: compiledStatementsContent,
          research_summary: researchSummary || 'No research summary available'
        };
        
        // Populate and call OpenAI for synthesis
        const populatedPrompt = populatePrompt(promptResult.data.prompt, parameters);
        
        const { error: synthErr, text: synthesizedStatement } = await generateResponse({
          messages: [{ role: 'user', content: populatedPrompt }],
          maxTokens: 1500,
          temperature: 0.7
        });
        
        if (synthErr) {
          throw new Error(synthErr);
        }
        
        // Set conversation started flag
        setConversationStarted(true);
        
        // Get narrative_build_companion prompt for the conversation
        const companionPromptResult = await getPromptByTypeStrong('narrative_build_companion');
        if (!companionPromptResult.success || !companionPromptResult.data) {
          throw new Error('Failed to load narrative_build_companion prompt');
        }
        
        // Prepare parameters for the companion prompt
        const companionParameters = {
          selected_statement: synthesizedStatement,
          companion_name: (selectedCompanion as any)?.companion || selectedCompanion?.name || 'Companion',
          research_summary: researchSummary || 'No research summary available',
          conversation_history: 'Beginning refinement of multiple selected statements'
        };
        
        // Use the companion prompt to generate the conversation message
        const companionPrompt = populatePrompt(companionPromptResult.data.prompt, companionParameters);
        await sendMessage(companionPrompt);
      }
      
      setHasInitiatedDiscussion(true); // Latch - keep it true after first click
      
    } catch (error: any) {
      console.error('Error in handleInitiateMultiStatementDiscussion:', error);
      toast({
        title: 'Discussion Error',
        description: error.message || 'Could not initiate discussion.',
        variant: 'destructive'
      });
    } finally {
      setIsDiscussingStatements(false);
      initiatingDiscussionRef.current = false;
      // Don't reset hasInitiatedDiscussion - keep it latched
    }
  }, [selectedStatements, hasInitiatedDiscussion, toast, getPromptByTypeStrong, generateResponse, sendMessage, selectedCompanion, researchSummary]);

  const handleOpenEditVocationalModal = useCallback(async () => {
    if (selectedStatements.length === 0) {
      toast({
        title: 'No Statements Selected',
        description: 'Please select at least one vocational statement to edit.',
        variant: 'default',
      });
      return;
    }

    setIsSynthesizingForEdit(true);

    try {
      const promptType: PromptType = selectedStatements.length === 1
        ? 'vocational_statement_synthesis'
        : 'vocational_statement_synthesized_multiple';

      const promptResult = await getPromptByTypeStrong(promptType);
      if (!promptResult.success || !promptResult.data) {
        throw new Error(`Failed to load the ${promptType} prompt for editing.`);
      }
      const promptTemplate = promptResult.data.prompt;

      const compiledStatementsContent = selectedStatements
        .map(stmt => stmt.content || stmt.mission_statement || JSON.stringify(stmt))
        .join('\n\n---\n\n');

      const compiledMessageHistory = narrativeMessages
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const placeholders = {
        selected_statements_content: compiledStatementsContent,
        message_history: compiledMessageHistory,
      };

      const populatedPrompt = populatePrompt(promptTemplate, placeholders);

      const aiResponse = await generateResponse({
        messages: [{ role: 'user', content: populatedPrompt }],
        maxTokens: 1500,
      });

      if (aiResponse.text && !aiResponse.error) {
        let statementForEditing = aiResponse.text;

        try {
          const parsed = JSON.parse(aiResponse.text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            if (first && typeof first.mission_statement === 'string') {
              statementForEditing = first.mission_statement;
            } else if (typeof first === 'string') {
              statementForEditing = first;
            }
          } else if (parsed && typeof parsed.synthesized_vocational_statement === 'string') {
            statementForEditing = parsed.synthesized_vocational_statement;
          }
        } catch {
          // fall back to raw text
        }

        setEditingVocationalContent(statementForEditing);
        setShowEditVocationalModal(true);
        toast({ title: 'Synthesis Complete', description: 'You can now edit the synthesized vocational statement.' });
      } else {
        throw new Error(aiResponse.error || 'Failed to synthesize vocational statement for editing.');
      }

    } catch (error: any) {
      toast({
        title: 'Synthesis Error',
        description: error.message || 'Could not synthesize vocational statement.',
        variant: 'destructive',
      });
    } finally {
      setIsSynthesizingForEdit(false);
    }
  }, [selectedStatements, narrativeMessages, getPromptByTypeStrong, generateResponse, toast]);

  const handleSaveEditedVocationalStatement = useCallback(async (editedContent: string) => {
    if (!currentUser) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }
    if (!editedContent.trim()) {
      toast({ title: 'Error', description: 'Cannot save empty vocational statement.', variant: 'destructive' });
      return;
    }

    setIsSavingEditedVocationalStatement(true);
    try {
      const userId = currentUser.id;

      if (selectedViewStatement) {
        const statementData = { ...selectedViewStatement, content: editedContent };
        await handleSaveVocationalStatement(statementData, 'edit', selectedViewStatement);
      } else {
        localStorage.setItem(LS.VOCATIONAL_STATEMENT, editedContent);
        await saveVocationalStatement(editedContent, userId);
      }

      toast({ title: 'Success', description: 'Vocational statement saved successfully.' });
      setShowEditVocationalModal(false);
      navigate('/scenario');

    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error.message || 'Could not save the vocational statement.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEditedVocationalStatement(false);
    }
  }, [currentUser, selectedViewStatement, navigate, toast, handleSaveVocationalStatement]);

  const handleOpenVocationalDialog = useCallback((role: AvatarRole | 'system', statement?: UIVocationalStatement, mode: 'add' | 'edit' | 'adapt' = 'add') => {
    setDialogAvatarRole(role);
    setEditingStatement(statement || null);
    setDialogMode(mode);
    setShowVocationalDialog(true);
  }, []);

  useEffect(() => {
    if (missingAvatars && !avatarsLoading) {
      setShowAvatarModal(true);
    }
  }, [missingAvatars, avatarsLoading]);

  const { prompts: _prompts } = usePrompts();

  // Mentionable avatars: side-effect free
  const mentionableAvatars = useMemo(() => {
    const avatars: Array<{ id: string; name: string; role: AvatarRole; avatarUrl?: string; type: string }> = [];
    if (selectedChurchAvatar) {
      avatars.push({
        id: selectedChurchAvatar.id,
        name: selectedChurchAvatar.name,
        role: 'church',
        avatarUrl: selectedChurchAvatar.avatar_url || selectedChurchAvatar.image_url,
        type: 'church'
      });
    }
    if (selectedCompanion) {
      avatars.push({
        id: selectedCompanion.id,
        name: (selectedCompanion as any)?.companion || selectedCompanion.name || 'Companion',
        role: 'companion',
        avatarUrl: selectedCompanion.avatar_url,
        type: 'companion',
      });
    }
    return avatars;
  }, [selectedChurchAvatar, selectedCompanion]);

  // Initial generation effect (no scenario dependency)
  const generationAttemptsRef = useRef(0);
  const maxGenerationAttempts = 3;

  useEffect(() => {
    if (
      researchSummary &&
      researchSummary.length > 0 &&
      prompts && Object.keys(prompts).length > 0 &&
      generationAttemptsRef.current < maxGenerationAttempts
    ) {
      generationAttemptsRef.current++;

      // generate church
      churchVocationalHook.generate({
        researchSummary,
        avatarData: selectedChurchAvatar || {
          id: 'default',
          name: 'Church',
          avatar_name: 'Default Church',
          role: 'church',
          avatar_point_of_view: 'A church perspective'
        } as ChurchAvatar,
        avatarRole: 'church',
      }).catch((err) => {
        console.error('[NarrativeBuild] Church vocational statement generation failed:', err);
      });

      // generate companion
      companionVocationalHook.generate({
        researchSummary,
        avatarData: selectedCompanion || {
          id: 'default',
          name: 'Default Companion',
          role: 'companion',
          companion: 'Default Companion',
          traits: 'wisdom, empathy',
          speech_pattern: 'thoughtful and clear',
          knowledge_domains: 'general guidance',
          companion_type: 'guide'
        } as Companion,
        avatarRole: 'companion',
      }).catch((err) => {
        console.error('[NarrativeBuild] Companion vocational statement generation failed:', err);
      });

    }
  }, [researchSummary, selectedCompanion, selectedChurchAvatar, prompts, churchVocationalHook, companionVocationalHook]);

  const generatedChurchStatements = useMemo(() => mapHookStatementsToUI(churchVocationalHook.statements, 'church', selectedStatements), [churchVocationalHook.statements, selectedStatements, selectedChurchAvatar, mapHookStatementsToUI]);
  const generatedCompanionStatements = useMemo(() => mapHookStatementsToUI(companionVocationalHook.statements, 'companion', selectedStatements), [companionVocationalHook.statements, selectedStatements, selectedCompanion, mapHookStatementsToUI]);
  const generatedSystemStatements = useMemo(() => mapHookStatementsToUI(systemVocationalHook.statements, 'system', selectedStatements), [systemVocationalHook.statements, selectedStatements, mapHookStatementsToUI]);

  const allDisplayableStatements = useMemo(() => {
    const statements = [
      ...generatedChurchStatements,
      ...generatedCompanionStatements,
      ...generatedSystemStatements,
    ];
    return statements;
  }, [generatedChurchStatements, generatedCompanionStatements, generatedSystemStatements]);

  const narrativeInputSubmitWrapper = useCallback(async (eventOrInput: React.FormEvent | string) => {
    let currentInput = '';
    if (typeof eventOrInput === 'string') {
      currentInput = eventOrInput;
    } else if (eventOrInput && typeof eventOrInput.preventDefault === 'function') {
      eventOrInput.preventDefault();
      currentInput = userInput;
    }

    if (!currentInput.trim()) return;

    if (handleUserMessageSubmit) {
      await handleUserMessageSubmit(currentInput);
      setUserInput('');
    } else {
      toast({ title: 'Error', description: 'Message submission handler not available.', variant: 'destructive' });
    }
  }, [handleUserMessageSubmit, userInput, toast]);

  type DialogProvidedStatementData = Partial<HookVocationalStatement> & {
    name: string;
    content: string;
    id?: string;
    mission_statement?: string;
    contextual_explanation?: string;
    theological_justification?: string;
    practical_application?: string;
  };

  const handleDialogSaveWrapper = useCallback((dataFromDialog: DialogProvidedStatementData) => {
    const originalStatement = editingStatement?.id ? allDisplayableStatements.find(s => s.id === editingStatement.id) : undefined;
    if (handleSaveVocationalStatement && dialogAvatarRole) {
      const fullDataForSave: StatementDataFromDialog = {
        id: dataFromDialog.id || uuidv4(),
        name: dataFromDialog.name,
        content: dataFromDialog.content,
        avatar_role: dataFromDialog.avatar_role || dialogAvatarRole || 'system',
        createdAt: typeof dataFromDialog.createdAt === 'string' ? dataFromDialog.createdAt : (dataFromDialog.createdAt instanceof Date ? dataFromDialog.createdAt.toISOString() : new Date().toISOString()),
        updatedAt: typeof dataFromDialog.updatedAt === 'string' ? dataFromDialog.updatedAt : (dataFromDialog.updatedAt instanceof Date ? dataFromDialog.updatedAt.toISOString() : new Date().toISOString()),
        mission_statement: dataFromDialog.mission_statement,
        contextual_explanation: dataFromDialog.contextual_explanation,
        theological_justification: dataFromDialog.theological_justification,
        practical_application: dataFromDialog.practical_application,
        key_insights: dataFromDialog.key_insights,
        counter_arguments: dataFromDialog.counter_arguments,
        supporting_scriptures: dataFromDialog.supporting_scriptures,
        user_id: dataFromDialog.user_id,
        original_ids: dataFromDialog.original_ids,
        resourceType: "narrative_statement",
        category: "narrative",
      };

      handleSaveVocationalStatement(fullDataForSave, dialogMode, editingStatement || undefined);
    } else {
      toast({ title: 'Error', description: 'Statement save handler or role not available.', variant: 'destructive' });
    }
  }, [handleSaveVocationalStatement, dialogMode, dialogAvatarRole, editingStatement, allDisplayableStatements, toast]);

  const handleToggleStatementSelection = useCallback((statementId: string) => {
    setSelectedStatements(prevSelected => {
      const isSelected = prevSelected.some(s => s.id === statementId);
      if (isSelected) {
        return prevSelected.filter(s => s.id !== statementId);
      } else {
        const statementToAdd = allDisplayableStatements.find(s => s.id === statementId);
        return statementToAdd ? [...prevSelected, statementToAdd] : prevSelected;
      }
    });
  }, [allDisplayableStatements]);

  const handleMessageSelect = useCallback((index: number) => {
    // EnhancedNarrativeConversation manages selected flags via parent onMessageSelect
  }, []);

  const handleRetryNarrativeGeneration = useCallback(() => {
    toast({ title: 'Retry Clicked', description: 'Retry functionality to be fully implemented.', variant: 'default' });
  }, [toast]);

  const handleUserInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      narrativeInputSubmitWrapper(userInput);
    }
  }, [narrativeInputSubmitWrapper, userInput]);

  const handleDirectMessage = useCallback(async () => {
    toast({ title: 'Direct Message', description: 'TODO: Implement direct message UI/flow.' });
  }, [toast]);

  // Show avatar modal if avatars are missing
  useEffect(() => {
    if (avatarsLoading) return;
    if (!selectedChurchAvatar || !selectedCompanion) {
      const timer = setTimeout(() => {
        setShowAvatarModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [avatarsLoading, selectedChurchAvatar, selectedCompanion]);

  // Close the missing requirements modal if it's open and avatars are loaded
  useEffect(() => {
    if (showMissingModal && selectedChurchAvatar && selectedCompanion) {
      setShowMissingModal(false);
    }
  }, [showMissingModal, selectedChurchAvatar, selectedCompanion]);

  // Error handling for statement generation hooks
  const combinedStatementsError = churchVocationalHook.error || companionVocationalHook.error || systemVocationalHook.error;
  const hasShownStatementErrorRef = useRef(false);
  useEffect(() => {
    if (combinedStatementsError && !hasShownStatementErrorRef.current) {
      hasShownStatementErrorRef.current = true;
      toast({
        title: 'Statement Generation Error',
        description: `Failed to generate vocational statements: ${combinedStatementsError}. You may need to refresh or check avatar configurations.`,
        variant: 'destructive',
        duration: 7000,
      });
      setTimeout(() => { hasShownStatementErrorRef.current = false; }, 15000);
    }
  }, [combinedStatementsError, toast]);

  // Loading avatars
  if (avatarsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]" aria-live="polite">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading avatars...</p>
        </div>
      </div>
    );
  }

  // Missing requirements modal
  if (showMissingModal && missingRequirements.length > 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Missing Required Information</h2>
          <ul className="mb-6 text-left w-full list-disc pl-6">
            {missingRequirements.map((item, i) => (
              <li key={i} className="text-red-700 font-medium">{item}</li>
            ))}
          </ul>
          <p className="mb-4 text-gray-600 text-sm">Please complete the above before proceeding.</p>
          <Button onClick={() => setShowMissingModal(false)} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          className="mr-2 -ml-3 mt-1"
          onClick={() => navigate('/clergy-home')}
          aria-label="Back to homepage"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="ml-1">Back</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Refine your mission</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Based on combined research below you will find a series of optional mission statements. Select a statement
            that most closely resembles your hope for the future. After selecting a statement, use the interactive tool
            to refine your ongoing mission.
          </p>
        </div>
        <div className="md:w-64">
          {selectedCompanion && (
            <div className="p-4 border rounded-md bg-white shadow-sm">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCompanion?.avatar_url} alt={(selectedCompanion as any)?.companion || 'Companion'} />
                  <AvatarFallback>{((selectedCompanion as any)?.companion || '').charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-medium">{(selectedCompanion as any)?.companion || 'Your Companion'}</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowAvatarModal(true)}
                  size="sm"
                >
                  Change point of view
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposed mission statements</CardTitle>
        </CardHeader>
        <CardContent>
          {(churchVocationalHook.isGenerating || companionVocationalHook.isGenerating) && (
            <div className="flex items-center justify-center py-4" aria-live="polite">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
              <span>Generating statements...</span>
            </div>
          )}

          {allDisplayableStatements.length === 0 && !(churchVocationalHook.isGenerating || companionVocationalHook.isGenerating) && (
            <p className="text-muted-foreground py-4 text-center">
              No vocational statements generated yet. They will appear here once processed or can be added manually.
            </p>
          )}

          {(() => {
            const sortedStatements = [...allDisplayableStatements].sort((a, b) => {
              if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
              if (a.rank !== undefined) return -1;
              if (b.rank !== undefined) return 1;
              return 0;
            });

            const topStatement = sortedStatements.length > 0 ? sortedStatements[0] : null;
            const otherStatements = sortedStatements.slice(1);

            return (
              <>
                {topStatement && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                        {topStatement.rank !== undefined ? `Rank #${topStatement.rank}` : 'Synthesized from Contributions'}
                      </div>
                    </div>

                    <Card
                      key={topStatement.id}
                      className={`flex flex-col shadow-md transition-all duration-200 ${topStatement.isSelected ? 'border-primary border-2 bg-primary/5' : 'border-primary/50'}`}
                    >
                      <CardHeader className="flex flex-row items-start space-x-3 p-5 bg-muted/30">
                        <div className="mt-1 shrink-0">
                          <Checkbox
                            id={`select-stmt-${topStatement.id}`}
                            checked={!!selectedStatements.find(s => s.id === topStatement.id)}
                            onCheckedChange={() => handleToggleStatementSelection(topStatement.id!)}
                            className="h-4 w-4"
                            aria-label={`Select statement: ${topStatement.name}`}
                          />
                        </div>
                        <div className="flex-grow">
                          <CardTitle className="text-xl leading-tight">{topStatement.name}</CardTitle>
                          {narrativeError && <p className="text-destructive text-sm">Error: {narrativeError}</p>}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow p-5 text-base space-y-3">
                        {topStatement.mission_statement && (
                          <div>
                            <h4 className="font-semibold text-base mb-1">Mission Statement:</h4>
                            <p>{topStatement.mission_statement}</p>
                          </div>
                        )}
                        {topStatement.contextual_explanation && (
                          <div>
                            <h4 className="font-semibold text-base mb-1">Contextual Explanation:</h4>
                            <p>{topStatement.contextual_explanation}</p>
                          </div>
                        )}
                        {topStatement.theological_justification && (
                          <div>
                            <h4 className="font-semibold text-base mb-1">Theological Justification:</h4>
                            <p>{topStatement.theological_justification}</p>
                          </div>
                        )}
                        {topStatement.practical_application && (
                          <div>
                            <h4 className="font-semibold text-base mb-1">Practical Application:</h4>
                            <p>{topStatement.practical_application}</p>
                          </div>
                        )}
                        {(!topStatement.mission_statement && topStatement.content) && (
                          <div>
                            <h4 className="font-semibold text-base mb-1">Content:</h4>
                            <p>{topStatement.content}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {otherStatements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Alternative Statements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherStatements.map(stmt => (
                        <Card
                          key={stmt.id}
                          className={`flex flex-col mb-4 last:mb-0 transition-all duration-200 ${selectedStatements.find(s => s.id === stmt.id) ? 'border-primary border-2 bg-primary/5' : ''} cursor-pointer hover:shadow-md`}
                          onClick={(e) => {
                            if (e.target instanceof HTMLElement &&
                              !e.target.closest('input[type="checkbox"]') &&
                              !e.target.closest('button')) {
                              setSelectedViewStatement(stmt);
                              setShowStatementModal(true);
                            }
                          }}
                          role="button"
                          aria-label={`Open details for ${stmt.name}`}
                        >
                          <CardHeader className="flex flex-row items-start space-x-3 p-4">
                            <div className="mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                id={`select-stmt-${stmt.id}`}
                                checked={!!selectedStatements.find(s => s.id === stmt.id)}
                                onCheckedChange={() => handleToggleStatementSelection(stmt.id!)}
                                className="h-4 w-4"
                                aria-label={`Select statement: ${stmt.name}`}
                              />
                            </div>
                            <div className="flex-grow">
                              <CardTitle className="text-md leading-tight">{stmt.name}</CardTitle>
                              {stmt.rank !== undefined && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground mt-1">
                                  Rank #{stmt.rank}
                                </span>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="flex-grow text-sm space-y-1">
                            {stmt.mission_statement && <p className="line-clamp-2"><strong>Mission:</strong> {stmt.mission_statement}</p>}
                            {stmt.contextual_explanation && <p className="line-clamp-2"><strong>Context:</strong> {stmt.contextual_explanation}</p>}
                            {stmt.theological_justification && <p className="line-clamp-2"><strong>Theology:</strong> {stmt.theological_justification}</p>}
                            {stmt.practical_application && <p className="line-clamp-2"><strong>Application:</strong> {stmt.practical_application}</p>}
                            {(!stmt.mission_statement && stmt.content) && <p className="line-clamp-3">{stmt.content}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Refine action bar */}
          <div className="mt-6 flex items-center justify-between p-3 rounded-md bg-muted/20 border">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Selected:</span> {selectedStatements.length} statement{selectedStatements.length === 1 ? '' : 's'}
            </div>
            <Button
              onClick={handleInitiateMultiStatementDiscussion}
              disabled={isDiscussingStatements || hasInitiatedDiscussion || selectedStatements.length === 0}
              className="min-w-[220px]"
            >
              {isDiscussingStatements ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refining...
                </span>
              ) : hasInitiatedDiscussion ? (
                'Refinement started'
              ) : (
                'Refine selected statements'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-col items-start">
          <CardTitle>Customize your mission statement</CardTitle>
          <p>Engage in conversation with your Aspirational partner customizing this mission statement so it reflects your vision of the future.</p>
        </CardHeader>
        <CardContent>
          <EnhancedNarrativeConversation
            messages={narrativeMessages}
            isGenerating={isNarrativeLoading}
            initialSetupCompleted={true}
            promptsLoaded={true}
            onMessageSelect={handleMessageSelect}
            error={narrativeError}
            onRetry={handleRetryNarrativeGeneration}
            selectedSecondaryStatement={null}
            hideNextSteps={true}
            hideActions={true}
          />
          <div className="mt-4">
            <NarrativeMessageInput
              userInput={userInput}
              setUserInput={setUserInput}
              handleSubmit={(event) => narrativeInputSubmitWrapper(event)}
              onKeyDown={handleUserInputKeyDown}
              isLoading={isNarrativeLoading}
              onDirectMessage={handleDirectMessage}
              showDefineNarrativeButton={true}
              avatars={mentionableAvatars}
              handleNavigateToScenario={() => console.log('Navigate to Scenario Clicked - Placeholder')}
              handleFinalizeMissionStatement={handleOpenEditVocationalModal}
            />
          </div>
        </CardContent>
      </Card>

      {/* Avatar Selection Modal */}
      <VocationAvatarModal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
      />

      {/* Church Avatar Selection Modal */}
      <ChurchAvatarModal
        open={showChurchModal}
        onOpenChange={setShowChurchModal}
        selectChurchAvatar={(avatar) => {
          if (selectChurchAvatar) {
            selectChurchAvatar(avatar);
            setShowChurchModal(false);
          }
        }}
      />

      {/* Statement Detail Modal */}
      <Dialog open={showStatementModal} onOpenChange={setShowStatementModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedViewStatement?.name || 'Mission Statement'}
            </DialogTitle>
            <DialogDescription>
              {selectedViewStatement?.avatar_role && selectedViewStatement?.avatar_name && (
                <span className="text-sm text-muted-foreground">
                  Source: {selectedViewStatement.avatar_role.toUpperCase()} - {selectedViewStatement.avatar_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedViewStatement?.mission_statement && (
              <div>
                <h3 className="font-semibold mb-2">Mission Statement</h3>
                <p className="text-base">{selectedViewStatement.mission_statement}</p>
              </div>
            )}

            {selectedViewStatement?.contextual_explanation && (
              <div>
                <h3 className="font-semibold mb-2">Contextual Explanation</h3>
                <p className="text-base">{selectedViewStatement.contextual_explanation}</p>
              </div>
            )}

            {selectedViewStatement?.theological_justification && (
              <div>
                <h3 className="font-semibold mb-2">Theological Justification</h3>
                <p className="text-base">{selectedViewStatement.theological_justification}</p>
              </div>
            )}

            {selectedViewStatement?.practical_application && (
              <div>
                <h3 className="font-semibold mb-2">Practical Application</h3>
                <p className="text-base">{selectedViewStatement.practical_application}</p>
              </div>
            )}

            {(!selectedViewStatement?.mission_statement && selectedViewStatement?.content) && (
              <div>
                <h3 className="font-semibold mb-2">Content</h3>
                <p className="text-base">{selectedViewStatement.content}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedViewStatement?.id) {
                    handleToggleStatementSelection(selectedViewStatement.id);
                  }
                }}
              >
                {selectedViewStatement && selectedStatements.find(s => s.id === selectedViewStatement.id) ? 'Deselect' : 'Select'} Statement
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showVocationalDialog && (
        <VocationalStatementDialog
          isOpen={showVocationalDialog}
          onClose={() => {
            setShowVocationalDialog(false);
            setEditingStatement(null);
          }}
          onSave={handleDialogSaveWrapper}
          isLoading={isSynthesizingStatement || churchVocationalHook.isGenerating || companionVocationalHook.isGenerating}
          narrativeContext={researchSummary}
          initialStatementData={editingStatement}
          selectedStatements={selectedStatements}
          mode={dialogMode}
          avatarRole={dialogAvatarRole}
          key={editingStatement?.id || dialogAvatarRole + dialogMode}
        />
      )}

      {showEditVocationalModal && (
        <EditVocationalStatementModal
          isOpen={showEditVocationalModal}
          onClose={() => setShowEditVocationalModal(false)}
          initialContent={editingVocationalContent}
          onSave={handleSaveEditedVocationalStatement}
          isSaving={isSavingEditedVocationalStatement}
        />
      )}
    </div>
  );
};

const NarrativeBuildPageWrapper: React.FC = () => (
  <AvatarProvider>
    <NarrativeBuildContent />
  </AvatarProvider>
);

export default NarrativeBuildPageWrapper;
