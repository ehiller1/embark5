// src/pages/NarrativeBuild.tsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase'; // Fixed import path for DB access
import { toast } from '@/hooks/use-toast'; // Added for notifications
import { v4 as uuidv4 } from 'uuid';
import { VocationAvatarModal } from '@/components/VocationAvatarModal';
import { VocationalStatementDialog } from '@/components/VocationalStatementDialog';
import { UIVocationalStatement as ImportedUIVocationalStatement, AvatarRole, ChurchAvatar, CommunityAvatar } from '@/types/NarrativeTypes';
// REQUIRED_PROMPT_TYPES import removed, PromptType defined via path
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AvatarProvider, useAvatarContext } from '@/hooks/useAvatarContext';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';

import { useNarrativeGenerationRefactored } from '@/hooks/useNarrativeGenerationRefactored';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts, Prompt } from '@/hooks/usePrompts'; // Import Prompt type
import { useVocationalStatements, VocationalStatement as HookVocationalStatement } from '@/hooks/useVocationalStatements';
import { populatePrompt } from '@/utils/promptUtils';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EditVocationalStatementModal } from '@/components/narrative-build/EditVocationalStatementModal';
// import { toast } from '@/components/ui/use-toast'; // Removed to avoid duplicate declaration, using toast from @/hooks/use-toast
import { EnhancedNarrativeConversation } from '@/components/narrative-build/EnhancedNarrativeConversation';
import { NarrativeMessageInput } from '@/components/narrative-build/NarrativeMessageInput';

// Define PromptType correctly
type PromptType = typeof import('@/utils/promptUtils').REQUIRED_PROMPT_TYPES[number];

// Use the imported UIVocationalStatement which already has UI fields, and add isSelected.
interface UIVocationalStatement extends ImportedUIVocationalStatement {
  isSelected?: boolean;
  key_insights?: string[];
  counter_arguments?: string[];
  supporting_scriptures?: string[];
};

// Type for data coming from VocationalStatementDialog, should align with UIVocationalStatement
type StatementDataFromDialog = UIVocationalStatement & {
  mission_statement?: string;
  contextual_explanation?: string;
  theological_justification?: string;
  practical_application?: string;
  // any other fields the dialog might send
};

const NarrativeBuildContent: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    churchAvatar: selectedChurchAvatar,
    communityAvatar: selectedCommunityAvatar,
    companions,
    selectCompanion, // This is the function to select a companion
    selectedCompanionId, // The ID of the selected companion
  } = useNarrativeAvatar();

  const selectedCompanion = useMemo(() => {
    return companions.find(c => c.id === selectedCompanionId) || null;
  }, [companions, selectedCompanionId]);
  const { isLoading: avatarsLoading, /* error: avatarsError, */ missingAvatars } = useAvatarContext(); // avatarsError removed

  const [selectedStatements, setSelectedStatements] = useState<UIVocationalStatement[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false); // Added for companion selection modal
  const [showVocationalDialog, setShowVocationalDialog] = useState(false); // Renamed from isStatementDialogOpen for clarity with VocationAvatarModal
  const [editingStatement, setEditingStatement] = useState<UIVocationalStatement | null>(null); // Renamed from statementCurrentlyEditing for clarity
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'adapt'>('add');
  const [dialogAvatarRole, setDialogAvatarRole] = useState<AvatarRole | 'system'>('system');

  // State for the new Edit Vocational Statement flow
  const [showEditVocationalModal, setShowEditVocationalModal] = useState(false);
  const [editingVocationalContent, setEditingVocationalContent] = useState('');
  const [isSynthesizingForEdit, setIsSynthesizingForEdit] = useState(false);
  const [isSavingEditedVocationalStatement, setIsSavingEditedVocationalStatement] = useState(false);

  const [isSynthesizingStatement, setIsSynthesizingStatement] = useState(false);
  const [isDiscussingStatements, setIsDiscussingStatements] = useState(false);

  const churchAvatarForNarrative = useMemo(() => (
    selectedChurchAvatar
      ? { ...selectedChurchAvatar, role: 'church' as const } 
      : null
  ), [selectedChurchAvatar]);

  const communityAvatarForNarrative = useMemo(() => (
    selectedCommunityAvatar
      ? { ...selectedCommunityAvatar, role: 'community' as const }
      : null
  ), [selectedCommunityAvatar]);

  // Narrative generation hook and related utilities
  const { 
    messages: narrativeMessages, 
    userInput, 
    setUserInput, 
    handleUserMessageSubmit, 
    addMessage, 
    isLoading: isNarrativeLoading, 
    isGenerating, 
    error: narrativeError,
  } = useNarrativeGenerationRefactored(
    selectedCompanion, // This now correctly comes from useNarrativeAvatar
    churchAvatarForNarrative ? [churchAvatarForNarrative as ChurchAvatar] : [], 
    communityAvatarForNarrative ? [communityAvatarForNarrative as CommunityAvatar] : [] 
  );

  const { generateResponse } = useOpenAI();
  const { getPromptByType: getPromptFromPromptsHook } = usePrompts();
  const getPromptByTypeStrong = getPromptFromPromptsHook as (type: PromptType) => Promise<{ success: boolean; data?: Prompt; error?: any; }>;

  const churchVocationalHook = useVocationalStatements('church');
  const communityVocationalHook = useVocationalStatements('community');
  const companionVocationalHook = useVocationalStatements('companion');
  const systemVocationalHook = useVocationalStatements('system');

  const getHookForRole = (role: AvatarRole | 'system') => {
    switch (role) {
      case 'church': return churchVocationalHook;
      case 'community': return communityVocationalHook;
      case 'companion': return companionVocationalHook;
      case 'system': return systemVocationalHook;
      default: 
        console.warn(`[NarrativeBuild] Unknown role passed to getHookForRole: ${role}. Defaulting to system hook.`);
        return systemVocationalHook; 
    }
  };

  // const researchSummary = useMemo(() => localStorage.getItem('ResearchSummary_content') || '', []); // Old version, replaced
  const [researchSummary, setResearchSummary] = useState<string>('');
  const { prompts, loading: promptsLoading /*, getPromptByType, getPromptByTypeStrong */ } = usePrompts(); // Renamed loading to promptsLoading, getPromptByType from usePrompts removed as unused (getPromptByTypeStrong is used)

  useEffect(() => {
    const fetchAndSetResearchSummary = async () => {
      let summary = localStorage.getItem('ResearchSummary_content');
      console.log('[NarrativeBuild] Initial researchSummary from localStorage:', summary ? summary.substring(0, 100) + "..." : "null/empty");

      if (!summary) {
        console.log('[NarrativeBuild] ResearchSummary not in localStorage, attempting to fetch from DB...');
        try {
          const { data, error } = await supabase
            .from('resource_library')
            .select('content')
            .eq('resource_type', 'research_summary')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: 'single' row expected, but 0 rows found (not an error for us here)
            console.error('[NarrativeBuild] Error fetching research_summary from DB:', error);
            toast({
              title: 'Failed to load research summary',
              description: 'Could not retrieve research summary from the database. Please ensure one exists.',
              variant: 'destructive',
            });
          } else if (data && data.content) {
            summary = data.content;
            console.log('[NarrativeBuild] Successfully fetched research_summary from DB:', summary!.substring(0, 100) + "...");
            localStorage.setItem('ResearchSummary_content', summary ?? ''); // Cache it
          } else {
            console.log('[NarrativeBuild] No research_summary found in DB.');
            // Not showing a toast here, as it might be normal for a new user
            // toast({
            //   title: 'No Research Summary Available',
            //   description: 'A research summary is needed. None found in storage or database.',
            //   variant: 'info',
            // });
          }
        } catch (e) {
          console.error('[NarrativeBuild] Exception while fetching research_summary from DB:', e);
          toast({
            title: 'Error accessing research summary',
            description: 'An unexpected error occurred while fetching from database.',
            variant: 'destructive',
          });
        }
      }
      setResearchSummary(summary ?? ''); // Ensure string, never null
    };

    fetchAndSetResearchSummary();
  }, []); // Runs once on mount

  const mapHookStatementsToUI = useCallback((
    statements: HookVocationalStatement[],
    role: 'church' | 'community' | 'companion' | 'system',
    currentSelected: UIVocationalStatement[]
  ): UIVocationalStatement[] => {
    return statements.map((s) => {
      const id = s.id || uuidv4();
      const name = s.name || s.mission_statement || 'Untitled Statement';
      const content =
        s.content ||
        [s.mission_statement, s.contextual_explanation, s.theological_justification, s.practical_application]
          .filter(Boolean)
          .join('\n\n') ||
        'No content provided.';

      const uiStatement: UIVocationalStatement = {
        id,
        name,
        content,
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
        resourceType: s.resourceType || 'narrative_statement',
        category: s.category || 'narrative',
        user_id: s.user_id || currentUser?.id || undefined,
        original_ids: s.original_ids || [],
        mission_statement: s.mission_statement || '',
        contextual_explanation: s.contextual_explanation || '',
        theological_justification: s.theological_justification || '',
        practical_application: s.practical_application || '',
        avatar_role: role,
        avatar_name: role === 'church' ? selectedChurchAvatar?.name : role === 'community' ? selectedCommunityAvatar?.name : role === 'companion' ? selectedCompanion?.name : 'System',
        avatar_url: role === 'church' ? (selectedChurchAvatar?.avatar_url || selectedChurchAvatar?.image_url) : role === 'community' ? (selectedCommunityAvatar?.avatar_url || selectedCommunityAvatar?.image_url) : role === 'companion' ? selectedCompanion?.avatar_url : undefined,
        isSelected: currentSelected.some(sel => sel.id === id),
        ...(s.key_insights && { key_insights: s.key_insights }),
        ...(s.counter_arguments && { counter_arguments: s.counter_arguments }),
        ...(s.supporting_scriptures && { supporting_scriptures: s.supporting_scriptures }),
      };
      return uiStatement;
    });
  }, [currentUser, selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion, uuidv4]);

  const generateAdaptedStatement = useCallback(async (
    originalStatement: UIVocationalStatement,
    newData: StatementDataFromDialog,
    context?: string
  ): Promise<Partial<HookVocationalStatement>> => {
    const promptResult = await getPromptByTypeStrong('scenario_adaptation' as PromptType);
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
      .replace('{{original_statement_content}}', originalStatement.content || '')
      .replace('{{original_mission_statement}}', originalStatement.mission_statement || originalStatement.name || '')
      .replace('{{adaptation_request_details}}', newData.content || newData.mission_statement || 'Adapt based on new input.')
      .replace('{{contextual_summary}}', context || '');

    const aiResponse = await generateResponse({
      messages: [{ role: 'user', content: populatedPrompt }],
      maxTokens: 800,
    });

    if (aiResponse.error || !aiResponse.text) {
      toast({ title: 'Error', description: 'AI failed to adapt the statement.', variant: 'destructive' });
      throw new Error(aiResponse.error || 'AI adaptation failed.');
    }

    try {
      // Assuming AI response is the new mission_statement/content
      // A more robust solution would parse a structured response (e.g. JSON)
      return {
        mission_statement: aiResponse.text,
        // Potentially update other fields like contextual_explanation based on AI response
        // For example, if AI provides a more detailed breakdown:
        // contextual_explanation: parsedResponse.contextual_explanation, 
      };
    } catch (parseError) {
      toast({ title: 'Error', description: 'Failed to parse AI adaptation response.', variant: 'destructive' });
      throw new Error('Failed to parse AI adaptation response.');
    }
  }, [getPromptByTypeStrong, generateResponse, toast]);

  // const handleOpenEditDialog = useCallback((statement: UIVocationalStatement, role: AvatarRole | 'system') => {
  //   setDialogAvatarRole(role);
  //   setEditingStatement(statement || null);
  //   setDialogMode('edit');
  //   setShowVocationalDialog(true);
  // }, []);

  const handleSaveVocationalStatement = useCallback(async (statementData: StatementDataFromDialog, mode: 'add' | 'edit' | 'adapt', originalStatement?: UIVocationalStatement) => {
    const rawAvatarRole = statementData.avatar_role || dialogAvatarRole || 'system';
    let effectiveAvatarRole: 'church' | 'community' | 'companion' | 'system';

    switch (rawAvatarRole) {
      case 'church':
      case 'community':
      case 'companion':
      case 'system':
        effectiveAvatarRole = rawAvatarRole;
        break;
      default: // Maps 'user', 'synthesized', or any other to 'system'
        console.warn(`[NarrativeBuild] Mapping avatar role '${rawAvatarRole}' to 'system' for vocational statement.`);
        effectiveAvatarRole = 'system';
        break;
    }

    const hookToUse = getHookForRole(effectiveAvatarRole);
    console.log(`[NarrativeBuild] Saving statement for role: ${effectiveAvatarRole}`, statementData);

    if (mode === 'edit' && editingStatement?.id) {
      const statementToUpdate: HookVocationalStatement = {
        // CoreVocationalStatement fields
        id: editingStatement.id,
        name: statementData.name, // Already on UIVocationalStatement -> StatementDataFromDialog
        content: statementData.content, // Already on UIVocationalStatement -> StatementDataFromDialog
        createdAt: editingStatement.createdAt || new Date().toISOString(), // Keep original or set new if missing
        updatedAt: new Date().toISOString(),
        resourceType: 'narrative_statement',
        category: 'narrative',
        user_id: currentUser?.id || editingStatement.user_id || undefined,
        original_ids: editingStatement.original_ids || (statementData.original_ids || []),
        // HookVocationalStatement specific fields (from useVocationalStatements.ts definition)
        avatar_role: effectiveAvatarRole,
        mission_statement: statementData.mission_statement || '',
        contextual_explanation: statementData.contextual_explanation || '',
        theological_justification: statementData.theological_justification || '',
        practical_application: statementData.practical_application || '',
        // Include any other fields from statementData that are part of HookVocationalStatement
        ...(statementData as Partial<HookVocationalStatement>),
      };
      hookToUse.updateStatement(statementToUpdate);
      toast({ title: 'Statement Updated', description: `Vocational statement for ${effectiveAvatarRole} updated.` });
      setShowVocationalDialog(false);
      setEditingStatement(null);
    } else if (mode === 'add') {
      const newId = uuidv4();
      const statementToAdd: HookVocationalStatement = {
        // CoreVocationalStatement fields
        id: newId,
        name: statementData.name,
        content: statementData.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resourceType: 'narrative_statement',
        category: 'narrative',
        user_id: currentUser?.id || undefined,
        original_ids: statementData.original_ids || [],
        // HookVocationalStatement specific fields
        avatar_role: effectiveAvatarRole,
        mission_statement: statementData.mission_statement || '',
        contextual_explanation: statementData.contextual_explanation || '',
        theological_justification: statementData.theological_justification || '',
        practical_application: statementData.practical_application || '',
        // Include any other fields from statementData that are part of HookVocationalStatement
        ...(statementData as Partial<HookVocationalStatement>),
      };
      hookToUse.addStatement(statementToAdd);
      toast({ title: 'Statement Added', description: `New vocational statement for ${effectiveAvatarRole} added.` });
      setShowVocationalDialog(false);
      setEditingStatement(null);
    } else if (mode === 'adapt' && originalStatement) {
      setIsSynthesizingStatement(true);
      const adaptedStatement = await generateAdaptedStatement(originalStatement, statementData, researchSummary);
      setIsSynthesizingStatement(false);
      if (adaptedStatement) { // Check if adaptation was successful and returned data
        const statementToUpdate: HookVocationalStatement = {
          // Spread originalStatement fields first
          id: originalStatement.id,
          name: originalStatement.name, // Fallback
          content: originalStatement.content, // Fallback
          createdAt: originalStatement.createdAt,
          updatedAt: new Date().toISOString(),
          resourceType: originalStatement.resourceType,
          category: originalStatement.category,
          user_id: originalStatement.user_id,
          original_ids: originalStatement.original_ids,
          avatar_role: effectiveAvatarRole,
          mission_statement: originalStatement.mission_statement ?? '',
          contextual_explanation: originalStatement.contextual_explanation ?? '',
          theological_justification: originalStatement.theological_justification ?? '',
          practical_application: originalStatement.practical_application ?? '',
          key_insights: originalStatement.key_insights,
          counter_arguments: originalStatement.counter_arguments,
          supporting_scriptures: originalStatement.supporting_scriptures,
          // Now, override with adapted fields from adaptedStatement (which is Partial<HookVocationalStatement>)
          ...adaptedStatement,
          // Ensure name/content are updated if mission_statement is the primary adapted field and part of adaptedStatement
          ...(adaptedStatement.mission_statement && { 
              name: adaptedStatement.mission_statement, 
              content: adaptedStatement.contextual_explanation || adaptedStatement.mission_statement 
          }),
        };
        hookToUse.updateStatement(statementToUpdate);
        toast({ title: 'Statement Adapted', description: `Vocational statement for ${effectiveAvatarRole} adapted and updated.` });
        setShowVocationalDialog(false);
        setEditingStatement(null);
      } else {
        console.warn('[NarrativeBuild] Adaptation did not return data or failed, dialog remains open.');
        // Error toast should have been shown by generateAdaptedStatement or its calling logic if an error was thrown
      }
    } else {
      console.error('[NarrativeBuild] Invalid mode or missing editingStatement ID for save:', mode, editingStatement);
      toast({ title: 'Save Error', description: 'Could not save statement due to invalid mode or missing ID.', variant: 'destructive' });
      return;
    }
  }, [churchVocationalHook, communityVocationalHook, companionVocationalHook, systemVocationalHook, currentUser, editingStatement, dialogAvatarRole, getHookForRole, toast]);

  // ... rest of the code
  const handleInitiateMultiStatementDiscussion = useCallback(async (): Promise<void> => {
    if (selectedStatements.length === 0) {
      toast({
        title: 'No Statements Selected',
        description: 'Please select one or more statements to discuss.',
        variant: 'default',
      });
      return;
    }
    setIsDiscussingStatements(true);
    console.log('[NarrativeBuild] Initiating discussion for selected statements:', selectedStatements);

    // Ensure these variables are declared in this scope
    // const avatarsToPromptData: Array<any> = []; // Declared later or unused
    // let promptTemplate = ''; // Declared in try block
    // let compiledStatementsContent = ''; // Declared later or unused

    try {
      const promptResult = await getPromptByTypeStrong('narrative_response' as PromptType);
      if (!promptResult.success || !promptResult.data) {
        throw new Error(`Failed to load the narrative_response prompt.`);
      }
      const promptTemplate = promptResult.data.prompt;

      const compiledStatementsContent = selectedStatements
        .map(stmt => stmt.content || stmt.mission_statement || '')
        .join('\n\n---\n\n');

      const avatarsToPromptData = [];

      if (selectedChurchAvatar) {
        avatarsToPromptData.push({
          avatarObj: selectedChurchAvatar,
          role: 'church' as const,
          explicitType: 'Parish Church',
          id: selectedChurchAvatar.id,
          name: selectedChurchAvatar.name,
          pointOfView: selectedChurchAvatar.avatar_point_of_view,
          avatarUrl: selectedChurchAvatar.avatar_url || selectedChurchAvatar.image_url,
          researchSummary: researchSummary, 
        });
      }
      if (selectedCommunityAvatar) {
        avatarsToPromptData.push({
          avatarObj: selectedCommunityAvatar,
          role: 'community' as const,
          explicitType: 'Community Organization',
          id: selectedCommunityAvatar.id,
          name: selectedCommunityAvatar.name,
          pointOfView: selectedCommunityAvatar.avatar_point_of_view,
          avatarUrl: selectedCommunityAvatar.avatar_url || selectedCommunityAvatar.image_url,
          researchSummary: researchSummary, 
        });
      }
      // Patch: Ensure companion avatar is included if present and has required fields
      if (selectedCompanion && selectedCompanion.id && selectedCompanion.name) {
        avatarsToPromptData.push({
          avatarObj: selectedCompanion,
          role: 'companion' as const,
          explicitType: selectedCompanion.companion_type || '',
          id: selectedCompanion.id,
          name: selectedCompanion.name,
          traits: selectedCompanion.traits || '',
          speechPattern: selectedCompanion.speech_pattern || '',
          companionType: selectedCompanion.companion_type || '',
          avatarUrl: selectedCompanion.avatar_url || '',
          researchSummary: researchSummary,
        });
      }

      const avatarsToPrompt = avatarsToPromptData.filter(Boolean) as (
        { avatarObj: ChurchAvatar, role: 'church', explicitType: string, id: string, name: string, pointOfView: string, avatarUrl?: string, researchSummary: string } |
        { avatarObj: CommunityAvatar, role: 'community', explicitType: string, id: string, name: string, pointOfView: string, avatarUrl?: string, researchSummary: string } |
        { avatarObj: any, role: 'companion', explicitType: string, id: string, name: string, traits?: string, speechPattern?: string, companionType?: string, avatarUrl?: string }
      )[];

      if (avatarsToPrompt.length === 0) {
        toast({
          title: 'No Avatars Available',
          description: 'No church, community, or companion avatars are selected for discussion.',
        });
        setIsDiscussingStatements(false);
        return;
      }

      addMessage({
        role: 'user',
        content: `Let's discuss these statements:\n${compiledStatementsContent}`,
        name: currentUser?.email || 'User',
        avatarUrl: currentUser?.user_metadata?.avatar_url
      });

      const discussionPromises = avatarsToPrompt.map(async (avatarData) => {
        if (!avatarData || !avatarData.id || !avatarData.name) {
          console.warn('[NarrativeBuild] Skipping avatar due to missing data (id or name):', avatarData);
          return null;
        }

        // Build the parameters object for populatePrompt
        const parameters: Record<string, string> = {
          vocational_statement: compiledStatementsContent,
          companion_name: selectedCompanion?.name || '',
          companion_type: selectedCompanion?.companion_type || '',
          companion_traits: selectedCompanion?.traits || '',
          companion_speech_pattern: selectedCompanion?.speech_pattern || '',
          church_avatar: selectedChurchAvatar?.name || '',
          community_avatar: selectedCommunityAvatar?.name || '',
          // Add any other placeholders your prompt may require
        };

        // Use populatePrompt for all avatars
        let populatedPrompt = populatePrompt(promptTemplate, parameters);
        console.log(`[NarrativeBuild] Populated prompt for ${avatarData.role}:`, populatedPrompt);

        const response = await generateResponse({
          messages: [{ role: 'user', content: populatedPrompt }],
          maxTokens: 1000,
        });

        if (response.text && !response.error) {
          addMessage({
            role: avatarData.role as AvatarRole,
            content: response.text,
            name: avatarData.name,
            avatarUrl: avatarData.avatarUrl
          });
        } else {
          const errorMessage = response.error || `Failed to get a response from ${avatarData.name}.`;
          addMessage({
            role: 'system',
            content: errorMessage,
            name: 'System Message',
            avatarUrl: avatarData.avatarUrl 
          });
          toast({ title: 'Error Generating Discussion', description: errorMessage, variant: 'destructive' });
        }
      });

      await Promise.all(discussionPromises);

    } catch (error: any) {
      console.error('[NarrativeBuild] Error initiating multi-statement discussion:', error);
      toast({
        title: 'Discussion Error',
        description: error.message || 'Could not initiate discussion with AI avatars.',
        variant: 'destructive'
      });
    } finally {
      setIsDiscussingStatements(false);
    }
  }, [selectedStatements, selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion, getPromptByTypeStrong, generateResponse, toast, addMessage, currentUser, researchSummary, setIsDiscussingStatements]);

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
    console.log('[NarrativeBuild] Opening Edit Vocational Modal for statements:', selectedStatements);
    console.log('[NarrativeBuild] Current message history:', narrativeMessages);

    try {
      // Determine prompt type
      const promptType: PromptType = selectedStatements.length === 1
        ? 'vocational_statement_synthesis'
        : 'vocational_statement_synthesized_multiple';

      const promptResult = await getPromptByTypeStrong(promptType);
      if (!promptResult.success || !promptResult.data) {
        throw new Error(`Failed to load the ${promptType} prompt for editing.`);
      }
      const promptTemplate = promptResult.data.prompt;

      // Compile selected statements content
      const compiledStatementsContent = selectedStatements
        .map(stmt => stmt.content || stmt.mission_statement || JSON.stringify(stmt)) // Fallback to stringify if no direct content
        .join('\n\n---\n\n');

      // Compile message history content
      const compiledMessageHistory = narrativeMessages
        .map(msg => `${msg.name || msg.role}: ${msg.content}`)
        .join('\n');

      const placeholders = {
        selected_statements_content: compiledStatementsContent,
        message_history: compiledMessageHistory,
        // research_summary: researchSummary, // Add if your prompts use it
      };

      // Ensure all required placeholders for the specific prompt are present in `placeholders`
      // This might require inspecting the prompt templates for 'vocational_statement_synthesis' and 'vocational_statement_synthesized_multiple'
      // For now, proceeding with assumed placeholders. Adjust as needed.
      const populatedPrompt = populatePrompt(promptTemplate, placeholders);

      const aiResponse = await generateResponse({
        messages: [{ role: 'user', content: populatedPrompt }],
        maxTokens: 1500, // Adjust as needed for expected length of synthesized vocational statement
      });

      if (aiResponse.text && !aiResponse.error) {
        let statementForEditing = aiResponse.text; // Default to raw text

        try {
          // Attempt 1: Parse directly
          const parsedResponse = JSON.parse(aiResponse.text);

          if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
            const firstItem = parsedResponse[0];
            if (firstItem && typeof firstItem.mission_statement === 'string') {
              statementForEditing = firstItem.mission_statement;
            } else if (typeof firstItem === 'string') {
              statementForEditing = firstItem; // Array of strings
            } else {
              console.warn('[NarrativeBuild] Parsed array item is not in expected format (missing mission_statement or not a string). Using raw text.');
            }
          } else if (parsedResponse && typeof parsedResponse.synthesized_vocational_statement === 'string') {
            // Handle single object with synthesized_vocational_statement key
            statementForEditing = parsedResponse.synthesized_vocational_statement;
          } else {
            console.warn('[NarrativeBuild] Parsed response is not an array or expected object. Using raw text.');
          }
        } catch (e1) {
          // Attempt 2: Try to fix if it looks like a list of objects needing brackets
          console.warn('[NarrativeBuild] Initial JSON.parse failed. Attempting to fix and re-parse. Error:', e1);
          if (aiResponse.text.trim().startsWith("{") && aiResponse.text.trim().endsWith("}") && aiResponse.text.includes("},{")) {
            const fixedJsonString = `[${aiResponse.text}]`;
            try {
              const parsedFixedResponse = JSON.parse(fixedJsonString);
              if (Array.isArray(parsedFixedResponse) && parsedFixedResponse.length > 0) {
                const firstItem = parsedFixedResponse[0];
                if (firstItem && typeof firstItem.mission_statement === 'string') {
                  statementForEditing = firstItem.mission_statement;
                } else if (typeof firstItem === 'string') {
                  statementForEditing = firstItem;
                } else {
                  console.warn('[NarrativeBuild] Fixed and parsed array item is not in expected format. Using raw text.');
                }
              } else {
                console.warn('[NarrativeBuild] Fixed string parsed, but not a non-empty array. Using raw text.');
              }
            } catch (e2) {
              console.warn('[NarrativeBuild] Failed to parse even after attempting to fix JSON. Using raw text. Error:', e2);
            }
          } else {
            console.warn('[NarrativeBuild] Does not look like a fixable list of JSON objects. Using raw text.');
          }
        }

        setEditingVocationalContent(statementForEditing);
        setShowEditVocationalModal(true);
        toast({ title: 'Synthesis Complete', description: 'You can now edit the synthesized vocational statement.', variant: 'default' });
      } else {
        throw new Error(aiResponse.error || 'Failed to synthesize vocational statement for editing.');
      }

    } catch (error: any) {
      console.error('[NarrativeBuild] Error synthesizing vocational statement for editing:', error);
      toast({
        title: 'Synthesis Error',
        description: error.message || 'Could not synthesize vocational statement for editing.',
        variant: 'destructive',
      });
    } finally {
      setIsSynthesizingForEdit(false);
    }
  }, [selectedStatements, narrativeMessages, getPromptByTypeStrong, generateResponse, toast, researchSummary]); // Added researchSummary to deps

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
      // 1. Save to Local Storage
      localStorage.setItem('vocational_statement', editedContent);
      console.log('[NarrativeBuild] Saved to localStorage:', editedContent);

      // 2. Derive title and save to Supabase 'resource_library' table
      let title = 'Untitled Vocational Statement';
      try {
        const parsedContent = JSON.parse(editedContent);
        if (parsedContent && typeof parsedContent.mission_statement === 'string' && parsedContent.mission_statement.trim() !== '') {
          title = parsedContent.mission_statement.trim();
        } else if (parsedContent && typeof parsedContent.title === 'string' && parsedContent.title.trim() !== '') {
          title = parsedContent.title.trim();
        }
      } catch (e) {
        // Not JSON or mission_statement/title field not present/valid, use a snippet of the content
        if (editedContent.trim().length > 0) {
          title = editedContent.trim().substring(0, 100);
          if (editedContent.trim().length > 100) {
            title += '...';
          }
        }
      }

      const { error: dbError } = await supabase
        .from('resource_library') // Ensure this table exists with appropriate columns
        .insert({
          // id: uuidv4(), // Supabase can auto-generate UUID if column is set up for it
          user_id: currentUser.id,
          title: title, // Add the derived title here
          content: editedContent,
          resource_type: 'vocational_statement',
          // metadata: { source: 'NarrativeBuild Edit Flow' } // Optional: add any other metadata
        });

      if (dbError) {
        console.error('[NarrativeBuild] Supabase error saving to resource_library:', dbError);
        throw new Error(`Failed to save to database: ${dbError.message}`);
      }

      toast({ title: 'Success', description: 'Vocational statement saved successfully.', variant: 'default' });
      setShowEditVocationalModal(false); // Close modal on successful save
      navigate('/scenario'); // Navigate to Scenario page

    } catch (error: any) {
      console.error('[NarrativeBuild] Error saving edited vocational statement:', error);
      toast({
        title: 'Save Error',
        description: error.message || 'Could not save the vocational statement.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEditedVocationalStatement(false);
    }
  }, [currentUser, supabase, navigate]); // Added supabase and navigate to dependencies



  /* handleDirectMessage moved earlier */

  /* handleUserInputKeyDown moved earlier */

  // Original handleOpenVocationalDialog definition is fine, calls to it will be fixed.
  const handleOpenVocationalDialog = useCallback((role: AvatarRole | 'system', statement?: UIVocationalStatement, mode: 'add' | 'edit' | 'adapt' = 'add') => {
    setDialogAvatarRole(role);
    setEditingStatement(statement || null);
    setDialogMode(mode);
    setShowVocationalDialog(true);
  }, [setDialogAvatarRole, setEditingStatement, setDialogMode, setShowVocationalDialog]);

  useEffect(() => {
    if (missingAvatars && !avatarsLoading) {
      setShowAvatarModal(true);
    }
  }, [missingAvatars, avatarsLoading, setShowAvatarModal]);

  const mentionableAvatars = useMemo(() => {
    const avatars = [];
    if (selectedChurchAvatar) {
      avatars.push({
        id: selectedChurchAvatar.id,
        name: selectedChurchAvatar.name,
        role: 'church' as AvatarRole,
        avatarUrl: selectedChurchAvatar.avatar_url || selectedChurchAvatar.image_url,
        type: 'church'
      });
    }
    if (selectedCommunityAvatar) {
      avatars.push({
        id: selectedCommunityAvatar.id,
        name: selectedCommunityAvatar.name,
        role: 'community' as AvatarRole,
        avatarUrl: selectedCommunityAvatar.avatar_url || selectedCommunityAvatar.image_url,
      });
    } else {
      console.warn('[NarrativeBuild] Skipping community vocational statement generation: selectedCommunityAvatar is undefined.');
    }

    if (selectedCompanion) {
      companionVocationalHook.generate({
        researchSummary: researchSummary || '', // Added null/empty string fallback
        avatarData: selectedCompanion,
        avatarRole: 'companion',
      }).then(() => {
        console.log('[NarrativeBuild] Companion vocational statement generation complete.');
      }).catch((err) => {
        console.error('[NarrativeBuild] Companion vocational statement generation failed:', err);
      });
    }
    return avatars;
  }, [selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion]);

  const generationAttemptsRef = useRef(0);
  const maxGenerationAttempts = 3; // Increased for testing

  // Effect for initial statement generation for each avatar (SIMPLIFIED FOR TESTING)
  useEffect(() => {
    console.log('%c[NarrativeBuild] EFFECT FOR INITIAL VOCATIONAL STATEMENT GENERATION TRIGGERED (Simplified)', 'color: orange; font-weight: bold; font-size: 1.2em;');
    console.log('[NarrativeBuild] Simplified State Check:', {
      researchSummaryAvailable: !!researchSummary,
      researchSummaryLength: researchSummary ? researchSummary.length : 0,
      promptsLoading, // from usePrompts
      promptsAvailable: prompts && Object.keys(prompts).length > 0,
      selectedCompanion: !!selectedCompanion,
      selectedChurchAvatar: !!selectedChurchAvatar,
      selectedCommunityAvatar: !!selectedCommunityAvatar,
      generationAttempts: generationAttemptsRef.current,
      maxAttempts: maxGenerationAttempts,
    });

    if (
      !promptsLoading &&
      selectedCompanion && selectedChurchAvatar && selectedCommunityAvatar &&
      researchSummary && researchSummary.length > 0 &&
      prompts && Object.keys(prompts).length > 0 && // Ensure prompts object is populated
      generationAttemptsRef.current < maxGenerationAttempts
    ) {
      generationAttemptsRef.current++;
      console.log(`%c[NarrativeBuild] SIMPLIFIED: Conditions MET for generation (attempt ${generationAttemptsRef.current}). Calling generate...`, 'color: green; font-weight: bold;');

      // Generate vocational statements for each avatar role, only if avatar is defined
      if (selectedChurchAvatar) {
        churchVocationalHook.generate({
          researchSummary,
          avatarData: selectedChurchAvatar,
          avatarRole: 'church',
        }).then(() => {
          console.log('[NarrativeBuild] Church vocational statement generation complete.');
        }).catch((err) => {
          console.error('[NarrativeBuild] Church vocational statement generation failed:', err);
        });
      } else {
        console.warn('[NarrativeBuild] Skipping church vocational statement generation: selectedChurchAvatar is undefined.');
      }

      if (selectedCommunityAvatar) {
        communityVocationalHook.generate({
          researchSummary,
          avatarData: selectedCommunityAvatar,
          avatarRole: 'community',
        }).then(() => {
          console.log('[NarrativeBuild] Community vocational statement generation complete.');
        }).catch((err) => {
          console.error('[NarrativeBuild] Community vocational statement generation failed:', err);
        });
      } else {
        console.warn('[NarrativeBuild] Skipping community vocational statement generation: selectedCommunityAvatar is undefined.');
      }

      if (selectedCompanion) {
        companionVocationalHook.generate({
          researchSummary,
          avatarData: selectedCompanion,
          avatarRole: 'companion',
        }).then(() => {
          console.log('[NarrativeBuild] Companion vocational statement generation complete.');
        }).catch((err) => {
          console.error('[NarrativeBuild] Companion vocational statement generation failed:', err);
        });
      } else {
        console.warn('[NarrativeBuild] Skipping companion vocational statement generation: selectedCompanion is undefined.');
      }

    } else {
      console.log('%c[NarrativeBuild] SIMPLIFIED: Conditions for generation NOT met.', 'color: red; font-weight: bold;');
      console.log('[NarrativeBuild] Reason for NOT meeting conditions (Simplified):', {
        promptsLoading,
        avatarsSelected: !!(selectedCompanion && selectedChurchAvatar && selectedCommunityAvatar),
        researchSummaryPresentAndNotEmpty: !!(researchSummary && researchSummary.length > 0),
        attemptLimitReached: generationAttemptsRef.current >= maxGenerationAttempts,
      });
    }
  }, [
    researchSummary,
    selectedCompanion,
    selectedChurchAvatar,
    selectedCommunityAvatar,
    promptsLoading,
    prompts,
  ]);

  const generatedChurchStatements = useMemo(() => mapHookStatementsToUI(churchVocationalHook.statements, 'church', selectedStatements), [churchVocationalHook.statements, selectedStatements, selectedChurchAvatar, mapHookStatementsToUI]);
  const generatedCommunityStatements = useMemo(() => mapHookStatementsToUI(communityVocationalHook.statements, 'community', selectedStatements), [communityVocationalHook.statements, selectedStatements, selectedCommunityAvatar, mapHookStatementsToUI]);
  const generatedCompanionStatements = useMemo(() => mapHookStatementsToUI(companionVocationalHook.statements, 'companion', selectedStatements), [companionVocationalHook.statements, selectedStatements, selectedCompanion, mapHookStatementsToUI]);
  const generatedSystemStatements = useMemo(() => mapHookStatementsToUI(systemVocationalHook.statements, 'system', selectedStatements), [systemVocationalHook.statements, selectedStatements, mapHookStatementsToUI]);

  const allDisplayableStatements = useMemo(() => [
    ...generatedChurchStatements,
    ...generatedCommunityStatements,
    ...generatedCompanionStatements,
    ...generatedSystemStatements,
  ], [generatedChurchStatements, generatedCommunityStatements, generatedCompanionStatements, generatedSystemStatements]);

  // Moved handler definitions earlier to avoid 'used before declaration' errors
  const narrativeInputSubmitWrapper = useCallback(async (eventOrInput: React.FormEvent | string) => {
    let currentInput = '';
    if (typeof eventOrInput === 'string') {
      currentInput = eventOrInput;
    } else if (eventOrInput && typeof eventOrInput.preventDefault === 'function') {
      eventOrInput.preventDefault();
      currentInput = userInput; // Assuming userInput state holds the value from NarrativeInput
    }

    if (!currentInput.trim()) return;

    console.log('narrativeInputSubmitWrapper called with:', currentInput);
    if (handleUserMessageSubmit) {
        await handleUserMessageSubmit(currentInput);
        setUserInput(''); // Clear input after submission
    } else {
        console.warn('handleUserMessageSubmit is not defined, cannot send message.');
        toast({ title: 'Error', description: 'Message submission handler not available.', variant: 'destructive' });
    }
  }, [handleUserMessageSubmit, userInput, setUserInput, toast]);

// Type provided by VocationalStatementDialog's onSave (derived from error message)
type DialogProvidedStatementData = Partial<HookVocationalStatement> & {
  name: string;
  content: string;
  id?: string;
  mission_statement?: string;
  contextual_explanation?: string;
  theological_justification?: string;
  practical_application?: string;
  avatar_role?: AvatarRole | 'system';
  createdAt?: string | Date; // Dialog might pass string or Date
  updatedAt?: string | Date;
  key_insights?: string[];
  counter_arguments?: string[];
  supporting_scriptures?: string[];
  user_id?: string;
  original_ids?: string[];
  resourceType?: string;
  category?: string;
  // Add any other fields that UIVocationalStatement has but might be optional from dialog
};

  const handleDialogSaveWrapper = useCallback((dataFromDialog: DialogProvidedStatementData) => {
    const originalStatement = editingStatement?.id ? allDisplayableStatements.find(s => s.id === editingStatement.id) : undefined;
    console.log('handleDialogSaveWrapper called with data:', dataFromDialog, 'mode:', dialogMode, 'role:', dialogAvatarRole, 'originalStatement:', originalStatement);
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
            resourceType: "narrative_statement", // Adjusted to specific literal type as per TS error
            category: "narrative", // Adjusted to specific literal type as per TS error
        };

        handleSaveVocationalStatement(fullDataForSave, dialogMode, editingStatement || undefined);
    } else {
        console.warn('handleSaveVocationalStatement or dialogAvatarRole is not defined, cannot save statement.');
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
  }, [allDisplayableStatements, setSelectedStatements]);

  // Adjusted for EnhancedNarrativeConversation's expected signature (index: number)
  const handleMessageSelect = useCallback((index: number) => {
    console.log('handleMessageSelect called with index:', index);
    // If you need the messageId, you'd get it from narrativeMessages[index].id
    // const messageId = narrativeMessages[index]?.id;
    // console.log('Corresponding messageId:', messageId);
  }, [/*narrativeMessages*/]); // Add narrativeMessages if you access it

  const handleRetryNarrativeGeneration = useCallback(() => {
    console.log('handleRetryNarrativeGeneration called');
    toast({ title: 'Retry Clicked', description: 'Retry functionality to be fully implemented.', variant: 'default' });
  }, [toast]);

  const handleUserInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      narrativeInputSubmitWrapper(userInput); // Pass userInput directly
    }
  }, [narrativeInputSubmitWrapper, userInput]);

  // Adjusted handleDirectMessage to not require a role if NarrativeInput doesn't provide it
  const handleDirectMessage = useCallback(async () => { // Removed _role parameter
    console.log('[NarrativeBuild] Direct message action triggered.');
    toast({ title: 'Direct Message', description: 'TODO: Implement direct message UI/flow.' });
  }, [toast]);

  /* narrativeInputSubmitWrapper moved earlier */

  /* handleDialogSaveWrapper moved earlier */

  /* handleToggleStatementSelection moved earlier */

  /* handleMessageSelect moved earlier */

  /* handleRetryNarrativeGeneration moved earlier */

  // Effect to show avatar modal if avatars are missing
  useEffect(() => {
    if (!avatarsLoading && (missingAvatars.church || missingAvatars.community || missingAvatars.companion)) {
      setShowAvatarModal(true);
    }
  }, [avatarsLoading, missingAvatars]);

  // Error handling for statement generation hooks
  const combinedStatementsError = churchVocationalHook.error || communityVocationalHook.error || companionVocationalHook.error || systemVocationalHook.error;
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
      setTimeout(() => { hasShownStatementErrorRef.current = false; }, 15000); // Allow new errors after a while
    }
  }, [combinedStatementsError, toast]);

  if (avatarsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading avatars...</p>
        </div>
      </div>
    );
  }

  // Render VocationAvatarModal if critical avatars are missing and not loading
  if (!selectedChurchAvatar || !selectedCommunityAvatar || !selectedCompanion) {
     // This modal will be shown via setShowAvatarModal(true) from the useEffect above
     // It's good practice to ensure it can be triggered if state somehow gets inconsistent
     if (!showAvatarModal && !avatarsLoading) setShowAvatarModal(true);
  }

  return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Build your church's vocation</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Craft vocational statements and explore them through conversations reflecting different points of view.
            </p>
          </div>
          <Button onClick={() => setShowAvatarModal(true)} variant="outline">Manage Avatars</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Enter into Conversation</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenEditVocationalModal}
              disabled={selectedStatements.length === 0 || isSynthesizingForEdit || isNarrativeLoading}
            >
              {isSynthesizingForEdit ? (
                <><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" /> Synthesizing...</>
              ) : (
                'Edit Vocational Statement'
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <EnhancedNarrativeConversation
              messages={narrativeMessages} /* Corrected: was 'messages' */
              isGenerating={isNarrativeLoading} /* Corrected: was 'isGenerating' */
              initialSetupCompleted={!!(selectedChurchAvatar && selectedCommunityAvatar && selectedCompanion)}
              promptsLoaded={true} /* TEMP: Assuming prompts are loaded, as promptsLoaded from usePrompts was removed */
              onMessageSelect={handleMessageSelect} /* Signature adjusted */
              error={narrativeError} /* Corrected: was 'error' */
              onRetry={handleRetryNarrativeGeneration} /* Connected */
            />
            <div className="mt-4">
              <NarrativeMessageInput
                userInput={userInput}
                setUserInput={setUserInput}
                handleSubmit={(event) => narrativeInputSubmitWrapper(event)} /* handleSubmit expects event, wrapper adapted */
                onKeyDown={handleUserInputKeyDown}
                isLoading={isNarrativeLoading} /* Corrected */
                onDirectMessage={handleDirectMessage} /* Signature adjusted */
                showDefineNarrativeButton={false} 
                avatars={mentionableAvatars}
                handleNavigateToScenario={() => console.log('Navigate to Scenario Clicked - Placeholder')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Vocational Statements</CardTitle>
          </CardHeader>
          <CardContent>
            {(churchVocationalHook.isGenerating || communityVocationalHook.isGenerating || companionVocationalHook.isGenerating) && (
              <div className="flex items-center justify-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
                <span>Generating statements...</span>
              </div>
            )}
            {allDisplayableStatements.length === 0 && !(churchVocationalHook.isGenerating || communityVocationalHook.isGenerating || companionVocationalHook.isGenerating) && (
              <p className="text-muted-foreground py-4 text-center">No vocational statements generated yet. They will appear here once processed or can be added manually.</p>
            )}
            
            {/* Sort statements by rank (if available) */}
            {(() => {
              // Sort statements with rank first, then unranked ones
              const sortedStatements = [...allDisplayableStatements].sort((a, b) => {
                // If both have ranks, sort by rank
                if (a.rank !== undefined && b.rank !== undefined) {
                  return a.rank - b.rank;
                }
                // Statements with ranks come before those without
                if (a.rank !== undefined) return -1;
                if (b.rank !== undefined) return 1;
                // If neither has a rank, maintain original order
                return 0;
              });
              
              // Separate top statement from the rest
              const topStatement = sortedStatements.length > 0 ? sortedStatements[0] : null;
              const otherStatements = sortedStatements.slice(1);
              
              return (
                <>
                  {/* Featured Top Statement */}
                  {topStatement && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                          {topStatement.rank !== undefined ? `Rank #${topStatement.rank}` : 'Sythnesized from All Contributions'}
                        </div>
                        <h3 className="text-lg font-semibold">The Best Articulation of Your Vocation</h3>
                      </div>
                      
                      <Card key={topStatement.id} className="flex flex-col border-primary/50 shadow-md">
                        <CardHeader className="flex flex-row items-start space-x-3 p-5 bg-muted/30">
                          <Checkbox
                            id={`select-stmt-${topStatement.id}`}
                            checked={topStatement.isSelected}
                            onCheckedChange={() => handleToggleStatementSelection(topStatement.id)}
                            className="mt-1 shrink-0"
                            aria-label={`Select statement: ${topStatement.name}`}
                          />
                          <div className="flex-grow">
                            <CardTitle className="text-xl leading-tight">{topStatement.name}</CardTitle>
                            {narrativeError && <p className="text-destructive text-sm">Error: {narrativeError}</p>}
                            <p className="text-sm text-muted-foreground mt-1">
                              Source: {topStatement.avatar_role?.toUpperCase()} - {topStatement.avatar_name}
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => topStatement.avatar_role && handleOpenVocationalDialog(topStatement.avatar_role, topStatement, 'edit')}
                            className="ml-auto shrink-0"
                            aria-label={`Edit statement: ${topStatement.name}`}
                          >
                            Edit
                          </Button>
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
                  
                  {/* Other Statements */}
                  {otherStatements.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Alternative Statements</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherStatements.map(stmt => (
                          <Card key={stmt.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start space-x-3 p-4">
                              <Checkbox
                                id={`select-stmt-${stmt.id}`}
                                checked={stmt.isSelected}
                                onCheckedChange={() => handleToggleStatementSelection(stmt.id)}
                                className="mt-1 shrink-0"
                                aria-label={`Select statement: ${stmt.name}`}
                              />
                              <div className="flex-grow">
                                <CardTitle className="text-md leading-tight">{stmt.name}</CardTitle>
                                {stmt.rank !== undefined && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground mt-1">
                                    Rank #{stmt.rank}
                                  </span>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Source: {stmt.avatar_role?.toUpperCase()} - {stmt.avatar_name}
                                </p>
                              </div>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => stmt.avatar_role && handleOpenVocationalDialog(stmt.avatar_role, stmt, 'edit')}
                                className="ml-auto shrink-0"
                                aria-label={`Edit statement: ${stmt.name}`}
                              >
                                Edit
                              </Button>
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
            
            {selectedStatements.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleInitiateMultiStatementDiscussion}
                  disabled={isGenerating || selectedStatements.length === 0}
                  size="lg"
                >
                  {isDiscussingStatements ? (
                    <><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" /> Discussing...</>
                  ) : (
                    `Discuss ${selectedStatements.length} Selected Statement(s)`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <VocationAvatarModal 
          open={showAvatarModal} 
          onOpenChange={setShowAvatarModal}
          onRequestCompanionChange={() => {
            setShowAvatarModal(false); // Close the overview modal
            setShowCompanionModal(true); // Open the companion selection modal
          }}
        />

        {/* Companion Selection Modal */}
        <VocationAvatarModal 
          open={showCompanionModal} 
          onOpenChange={setShowCompanionModal}
          selectionContext="companion"
          companionsList={companions || []}
          onSelectCompanion={(companion) => {
            if (selectCompanion && companion) {
              selectCompanion(companion.id);
              setShowCompanionModal(false);
            }
          }}
        />

        {showVocationalDialog && (
          <VocationalStatementDialog
            isOpen={showVocationalDialog}
            onClose={() => {
              setShowVocationalDialog(false);
              setEditingStatement(null);
            }}
            onSave={handleDialogSaveWrapper} /* Connected */
            isLoading={isSynthesizingStatement || churchVocationalHook.isGenerating || communityVocationalHook.isGenerating || companionVocationalHook.isGenerating}
            narrativeContext={researchSummary} // Or selectedNarrativeMessages for more focused context
            initialStatementData={editingStatement}
            selectedStatements={selectedStatements} // For context if adapting multiple
            mode={dialogMode}
            avatarRole={dialogAvatarRole}
            key={editingStatement?.id || dialogAvatarRole + dialogMode} // Force re-mount for different modes/statements
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
