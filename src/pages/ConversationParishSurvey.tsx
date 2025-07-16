import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ControlledConversationInterface } from '@/components/ControlledConversationInterface';
import { MainLayout } from '@/components/MainLayout';
import { supabase } from '@/integrations/lib/supabase';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ParishCompanion {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
}

// Survey JSON structure types
interface TextField {
  header: string;
  sample_text: string;
  question_id?: string; // Added to track original question ID
}

interface TextFieldSection {
  title: string;
  question: string;
  sample_text: string;
  question_id?: string; // Added to track original question ID
}

interface ConversationalSection {
  title: string;
  conversation_prompt: string;
  text_fields: TextField[];
  questions?: Array<{
    id: string;
    text: string;
    type: string;
    options?: string[];
  }>;
}

interface SurveyStructure {
  overall_direction: string;
  "text field section": TextFieldSection[];
  "conversational section": ConversationalSection[];
}

interface TextFieldResponse {
  sectionTitle: string;
  fieldHeader: string;
  response: string;
  question_id?: string; // ID of the original question for database mapping
}

// Survey template types
interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  metadata?: {
    church_id: string;
    survey_type: string;
    template_data?: {
      questions?: SurveyQuestion[];
    };
    questions?: SurveyQuestion[];
  };
  church_id: string;
  survey_type: string;
  template_data?: {
    questions?: SurveyQuestion[];
  };
  questions?: SurveyQuestion[];
}

// Hook to load current user's church ID
function useChurchId(): { churchId: string | null; loading: boolean } {
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', userId)
        .single();

      if (!profileError && profile?.church_id) {
        setChurchId(profile.church_id);
      }
      setLoading(false);
    })();
  }, []);

  return { churchId, loading };
}

// Utility function to convert survey template to the expected structure
function convertSurveyFormat(template: SurveyTemplate): SurveyStructure {
  try {
    console.log('Converting survey template:', template);
    
    // Check if template data is in the expected location
    let templateData = template.metadata?.template_data;
    
    // If not found in the expected location, try to find it elsewhere in the structure
    if (!templateData || !templateData.questions) {
      console.log('Template data not found in expected location, searching for questions...');
      
      // Try to find questions directly in metadata
      if (template.metadata?.questions) {
        console.log('Found questions directly in metadata');
        templateData = { questions: template.metadata.questions };
      }
      // Check if the entire template might be the template_data
      else if (template.questions) {
        console.log('Found questions directly in template root');
        templateData = { questions: template.questions };
      }
      // Last resort: check if the template itself is structured as expected
      else if (Array.isArray(template.metadata)) {
        console.log('Template metadata is an array, checking for questions');
        templateData = { questions: template.metadata };
      }
      
      if (!templateData || !templateData.questions) {
        console.error('Could not locate questions in template:', template);
        throw new Error('Invalid template data structure - questions not found');
      }
    }
    
    console.log('Using template data:', templateData);
    
    // Ensure questions is an array
    const questions = Array.isArray(templateData.questions) ? 
      templateData.questions : 
      [templateData.questions];
    
    console.log('Extracted questions:', questions);
    
    // Filter questions by type
    const textFieldQuestions = questions.filter(q => q.type === 'text');
    const multipleChoiceQuestions = questions.filter(q => 
      q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'rating'
    );
    
    console.log('Text field questions:', textFieldQuestions);
    console.log('Multiple choice questions:', multipleChoiceQuestions);
    
    // Base structure
    const surveyStructure: SurveyStructure = {
      overall_direction: template.description || "Please complete this survey to help us understand our community better.",
      "text field section": [],
      "conversational section": []
    };
    
    // Create text field sections (one section per text question for better organization)
    textFieldQuestions.forEach((question, index) => {
      surveyStructure["text field section"].push({
        title: `Written Response ${index + 1}`,
        question: question.text,
        sample_text: "Type your detailed thoughts here...",
        question_id: question.id // Store original question ID for response mapping
      });
    });
    
    // Create conversational sections (group by 3-4 questions per section)
    const chunkSize = 3;
    for (let i = 0; i < multipleChoiceQuestions.length; i += chunkSize) {
      const chunk = multipleChoiceQuestions.slice(i, i + chunkSize);
      const section: ConversationalSection = {
        title: `Interactive Questions - Part ${Math.floor(i / chunkSize) + 1}`,
        conversation_prompt: "Let's discuss the following topics. I'll guide you through each question:",
        text_fields: [],
        questions: chunk.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || []
        }))
      };
      
      // Add text fields for capturing responses during conversation
      chunk.forEach(question => {
        section.text_fields.push({
          header: question.text,
          sample_text: question.type === 'multiple_choice' 
            ? "Select from: " + (question.options || []).join(", ")
            : question.type === 'rating' 
              ? "Rate from 1-5" 
              : "Yes/No",
          question_id: question.id // Store original question ID
        });
      });
      
      surveyStructure["conversational section"].push(section);
    }
    
    // If no sections were created, add a default conversational section
    if (surveyStructure["text field section"].length === 0 && 
        surveyStructure["conversational section"].length === 0) {
      surveyStructure["text field section"].push({
        title: 'Default Survey Question',
        question: 'Please share your thoughts:',
        sample_text: 'Enter your response here...'
      });
      
      surveyStructure["conversational section"].push({
        title: 'Additional Information',
        conversation_prompt: 'Please provide any additional information:',
        text_fields: [{
          header: 'Additional Comments',
          sample_text: 'Enter any additional comments here...'
        }]
      });
    }
    
    console.log('Converted survey structure:', surveyStructure);
    return surveyStructure;
  } catch (error) {
    console.error('Error converting survey format:', error);
    // Return a default structure instead of throwing
    return {
      overall_direction: 'Please complete the following survey.',
      "text field section": [{
        title: 'Default Survey Question',
        question: 'Please share your thoughts:',
        sample_text: 'Enter your response here...'
      }],
      "conversational section": [{
        title: 'Additional Information',
        conversation_prompt: 'Please provide any additional information:',
        text_fields: [{
          header: 'Additional Comments',
          sample_text: 'Enter any additional comments here...'
        }]
      }]
    };
  }
}

// Helper function to initialize responses from survey structure
function initializeResponses(surveyStructure: SurveyStructure): TextFieldResponse[] {
  const initialTextFields: TextFieldResponse[] = [];
  
  // Add text field section responses
  surveyStructure["text field section"]?.forEach(section => {
    initialTextFields.push({
      sectionTitle: section.title,
      fieldHeader: section.question,
      response: '',
      question_id: section.question_id
    });
  });
  
  // Add conversational section responses
  surveyStructure["conversational section"]?.forEach(section => {
    section.text_fields.forEach(field => {
      initialTextFields.push({
        sectionTitle: section.title,
        fieldHeader: field.header,
        response: '',
        question_id: field.question_id
      });
    });
  });
  
  return initialTextFields;
}

export default function ConversationParishSurvey(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { churchId, loading: churchLoading } = useChurchId();

  // Parish companion state
  const [companions, setCompanions] = useState<ParishCompanion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(false);
  const [companionsError, setCompanionsError] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<ParishCompanion | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  
  // State for text inputs
  const [textInputs, setTextInputs] = useState({
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  });

  // Handle text input changes
  const handleInputChange = (field: keyof typeof textInputs, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const hasInitialized = useRef(false);
  
  // Survey structure state
  const [surveyStructure, setSurveyStructure] = useState<SurveyStructure | null>(null);
  const [textFieldResponses, setTextFieldResponses] = useState<TextFieldResponse[]>([]);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isTextFieldSection, setIsTextFieldSection] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Load companions
  useEffect(() => {
    const loadCompanions = async () => {
      setLoadingCompanions(true);
      try {
        const { data: companionsData, error } = await supabase
          .from('Companion_parish')
          .select('*');
        if (error) throw error;

        const mapped = (companionsData || []).map(item => ({
          id: item.UUID ?? '',
          name: item.companion ?? '',
          description: item.traits ?? '',
          knowledge_domains: item.knowledge_domains ?? '',
          avatar_url: item.avatar_url ?? ''
        }));

        setCompanions(mapped);
      } catch (err: any) {
        setCompanionsError(err.message);
        setCompanions([]);
      } finally {
        setLoadingCompanions(false);
      }
    };
    loadCompanions();
  }, []);

  // Load selected companion key from localStorage when ready
  useEffect(() => {
    if (!churchLoading && !loadingCompanions) {
      const stored = localStorage.getItem('parish_companion');
      if (stored) {
        try {
          setSelectedCompanion(JSON.parse(stored));
        } catch {}
      }
    }
  }, [churchLoading, loadingCompanions]);
  
  // Function declarations moved before usage
  // This section is now moved before handleSelectCompanion
  
  // This section is now moved before handleSelectCompanion
  
  // Declare handleSelectCompanion after initConversation is defined
  let handleSelectCompanion: (companion: ParishCompanion) => void;

  // Save conversation
 const saveConversation = useCallback(
  async (msgs: Message[]): Promise<boolean> => {
    if (!churchId || !selectedCompanion) return false;

    try {
      // Get the authenticated user ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('[saveConversation] Supabase userData:', userData);
      console.log('[saveConversation] Supabase userError:', userError);
      if (userError || !userData.user) throw userError || new Error('Unauthenticated');
      const userId = userData.user.id;

      // Upsert into your table—note the use of `conversation_history` and `conversation_page`
      const { data, error } = await supabase
        .from('conversation_history')
        .upsert({
          id: conversationId ?? undefined,
          user_id: userId,
          church_id: churchId,
          conversation_history: { messages: msgs },
          conversation_page: 'parish_survey'
        })
        .select('id')
        .single();

      if (error) {
        console.error('[saveConversation] Supabase upsert error:', error);
        throw error;
      }
      setConversationId(data.id);
      return true;
    } catch {
      // Fallback to localStorage if the DB write fails
      try {
        const storage = JSON.parse(localStorage.getItem('conversations') || '{}');
        const key = `church_${churchId}_companion_${selectedCompanion.id}`;
        storage[key] = { messages: msgs, savedAt: new Date().toISOString() };
        localStorage.setItem('conversations', JSON.stringify(storage));
        return true;
      } catch {
        return false;
      }
    }
  },
  [churchId, selectedCompanion, conversationId]
);

  // Generate AI response with enhanced logging
  const generateAIResponse = useCallback(
    async (msgs: Message[]): Promise<Message> => {
      const requestId = `req_${Date.now()}`;
      setLoadingConversation(true);
      
      try {
        // Log all messages being sent to the API
        console.group(`[${requestId}] Messages being sent to OpenAI:`);
        msgs.forEach((msg, idx) => {
          console.log(`[${idx}] ${msg.role.toUpperCase()}:`, 
            msg.role === 'system' ? 
              msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '') :
              msg.content
          );
        });
        console.groupEnd();

        const formatted = msgs.map(({ role, content }) => ({ role, content }));
        
        // Log the request payload
        console.log(`[${requestId}] Sending request to OpenAI:`, {
          model: 'gpt-4',
          messageCount: formatted.length,
          hasSystemMessage: formatted.some(m => m.role === 'system')
        });

        const { data, error } = await supabase.functions.invoke('openai', {
          body: { 
            messages: formatted, 
            model: 'gpt-4',
            request_id: requestId // Add request ID for tracking
          }
        });

        if (error) {
          console.error(`[${requestId}] Error from OpenAI API:`, error);
          throw error;
        }

        // Log the raw response
        console.group(`[${requestId}] Raw response from OpenAI:`);
        console.log('Response data:', data);
        if (data?.text) console.log('Response text:', data.text.substring(0, 200) + (data.text.length > 200 ? '...' : ''));
        console.groupEnd();

        let content = '';
        if (data?.text) {
          content = data.text;
          try {
            const parsed = JSON.parse(data.text);
            console.log(`[${requestId}] Parsed response:`, parsed);
            
            if (parsed.messages?.length) {
              content = parsed.messages[0].content;
            } else if (parsed.content) {
              content = parsed.content;
            }
          } catch (parseError) {
            console.log(`[${requestId}] Response is not JSON, using as plain text`);
          }
        } else if (data?.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else {
          console.error(`[${requestId}] Unrecognized response format:`, data);
          throw new Error('Unrecognized API response');
        }

        if (!content) {
          console.error(`[${requestId}] Empty content in response`);
          throw new Error('Empty response from AI');
        }

        console.log(`[${requestId}] Extracted AI response:`, 
          content.substring(0, 200) + (content.length > 200 ? '...' : '')
        );

        return {
          id: uuidv4(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`[${requestId}] Error in generateAIResponse:`, error);
        throw error;
      } finally {
        setLoadingConversation(false);
      }
    },
    []
  );

  // Initialize conversation
  const initConversation = useCallback(async () => {
    setLoadingPrompt(true);
    try {
      // Get the authenticated user
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error('Unauthenticated');

      // Get the user's church ID
      const { data: profileData } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', userId)
        .single();
      if (!profileData?.church_id) throw new Error('No church ID');

      // Get church profile data for context
      const { data: churchProfiles } = await supabase
        .from('church_profile')
        .select('*')
        .eq('church_id', profileData.church_id);
      const churchProfile = churchProfiles?.[0] || {};

      // Fetch the latest survey template for this church using church_id field
      console.log('Fetching survey template with church_id:', profileData.church_id);
      
      let { data: surveyTemplates, error: surveyError } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('church_id', profileData.church_id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (surveyError) {
        console.error('Error fetching survey templates:', surveyError);
      }
      
      console.log('Fetched survey templates using church_id field:', surveyTemplates);
      
      // If no templates found with direct church_id field, try fallback to metadata->church_id
      // This is for backward compatibility
      if (!surveyTemplates || surveyTemplates.length === 0) {
        console.log('No templates found with direct church_id, trying metadata->church_id fallback');
        const { data: fallbackTemplates, error: fallbackError } = await supabase
          .from('survey_templates')
          .select('*')
          .filter('metadata->church_id', 'eq', profileData.church_id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fallbackError) {
          console.error('Error in fallback survey template fetch:', fallbackError);
        } else if (fallbackTemplates && fallbackTemplates.length > 0) {
          console.log('Found survey template using metadata->church_id fallback:', fallbackTemplates);
          // Use the fallback templates instead
          surveyTemplates = fallbackTemplates;
        }
      }
      
      let surveyData: SurveyStructure | null = null;
      
      if (surveyTemplates && surveyTemplates.length > 0) {
        try {
          // Convert the survey template to our expected format
          const template = surveyTemplates[0] as SurveyTemplate;
          surveyData = convertSurveyFormat(template);
          setSurveyStructure(surveyData);
          
          // Initialize text field responses
          const initialResponses = initializeResponses(surveyData);
          setTextFieldResponses(initialResponses);
          
          console.log('Converted survey structure:', surveyData);
          console.log('Initialized responses:', initialResponses);
        } catch (e) {
          console.error('Failed to process survey template:', e);
        }
      }
      
      // If no survey template was found or conversion failed, create a default conversation
      if (!surveyData) {
        console.log('No survey template found, creating default conversation');
        
        // Fetch the survey_generation prompt
        const { data: promptRecord } = await supabase
          .from('prompts')
          .select('prompt')
          .eq('prompt_type', 'survey_generation')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!promptRecord?.prompt) throw new Error('No survey_generation prompt found');
        
        const params = {
          accomplish: churchProfile.accomplish || '',
          community_description: churchProfile.community_description || '',
          dream: churchProfile.dream || '',
          parish_companion: selectedCompanion?.name || 'Your Companion',
          active_members: churchProfile.number_of_active_members || '',
          pledging_members: churchProfile.number_of_pledging_members || ''
        };

        let systemContent = promptRecord.prompt;
        Object.entries(params).forEach(([key, val]) => {
          systemContent = systemContent.replace(
            new RegExp(`\\$\\(${key}\\)`, 'g'),
            val as string
          );
        });
        if (selectedCompanion?.knowledge_domains) {
          systemContent += `\n\nExpertise areas: ${selectedCompanion.knowledge_domains}`;
        }

        const systemMessage: Message = {
          id: uuidv4(),
          role: 'system',
          content: systemContent,
          timestamp: new Date().toISOString()
        };
        const initialAssistant: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: "Welcome! I'm here to help you with the parish survey. What would you like to share?",
          timestamp: new Date().toISOString()
        };

        setMessages([systemMessage, initialAssistant]);
        await saveConversation([systemMessage, initialAssistant]);
      } else {
        // Use the survey structure to create initial messages
        const systemMessage: Message = {
          id: uuidv4(),
          role: 'system',
          content: surveyData.overall_direction,
          timestamp: new Date().toISOString()
        };
        
        // Start with the first section's conversation prompt
        let initialContent = "Welcome to our parish survey!";
        if (surveyData["conversational section"]?.[0]) {
          initialContent = surveyData["conversational section"][0].conversation_prompt;
        }
        
        const initialAssistant: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: initialContent,
          timestamp: new Date().toISOString()
        };

        setMessages([systemMessage, initialAssistant]);
        await saveConversation([systemMessage, initialAssistant]);
      }
    } catch (err: any) {
      console.error('Error initializing conversation:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPrompt(false);
    }
  }, [selectedCompanion, saveConversation, toast]);

  // Now define handleSelectCompanion after initConversation is defined
  handleSelectCompanion = useCallback((companion: ParishCompanion) => {
    setSelectedCompanion(companion);
    localStorage.setItem('parish_companion', JSON.stringify(companion));
    setIsCompanionModalOpen(false);
    
    // Initialize conversation with the selected companion
    if (!hasInitialized.current) {
      initConversation();
    }
  }, [initConversation]);

  // Initialize once
  useEffect(() => {
    if (selectedCompanion && churchId && !hasInitialized.current) {
      hasInitialized.current = true;
      // Only initialize if we haven't already
      if (messages.length === 0) {
        initConversation();
      }
    }
  }, [selectedCompanion, churchId, initConversation]); // Removed messages.length dependency

  // Auto-save on unload or unmount
  useEffect(() => {
    if (messages.length === 0 || !selectedCompanion) return;
    const handler = () => { void saveConversation(messages); };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      void saveConversation(messages);
    };
  }, [messages, selectedCompanion, saveConversation]);

  // Prompt for companion selection
  useEffect(() => {
    if (!churchLoading && !selectedCompanion && !loadingCompanions) {
      setIsCompanionModalOpen(true);
    }
  }, [churchLoading, loadingCompanions, selectedCompanion]);

  // Handle text field changes
  const handleTextFieldChange = useCallback((sectionTitle: string, fieldHeader: string, value: string) => {
    setTextFieldResponses(prev => {
      const newResponses = [...prev];
      const index = newResponses.findIndex(
        r => r.sectionTitle === sectionTitle && r.fieldHeader === fieldHeader
      );
      if (index !== -1) {
        newResponses[index].response = value;
      }
      return newResponses;
    });
  }, []);

  // Navigate between sections
  const handleNextSection = useCallback(() => {
    if (!surveyStructure) return;
    
    const totalSections = (
      (surveyStructure["text field section"]?.length || 0) + 
      (surveyStructure["conversational section"]?.length || 0)
    );
    
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
      
      // Determine if the next section is a text field or conversational section
      const textFieldSectionCount = surveyStructure["text field section"]?.length || 0;
      setIsTextFieldSection(currentSection + 1 < textFieldSectionCount);
    }
  }, [currentSection, surveyStructure]);

  const handlePrevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      
      // Determine if the previous section is a text field or conversational section
      const textFieldSectionCount = surveyStructure?.["text field section"]?.length || 0;
      setIsTextFieldSection(currentSection - 1 < textFieldSectionCount);
    }
  }, [currentSection, surveyStructure]);

  // Handlers
  const handleSendMessage = useCallback(
    async (text: string, inputs?: { input1: string; input2: string; input3: string; input4: string }) => {
      const trimmed = text.trim();
      if (!trimmed || !churchId) return;
      if (!selectedCompanion) {
        toast({ title: 'Error', description: 'Please select a companion first', variant: 'destructive' });
        setIsCompanionModalOpen(true);
        return;
      }
      setLoadingConversation(true);
      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString()
      };

      // Immediately update UI
      setMessages(prevMessages => [...prevMessages, userMsg]);
      saveConversation([...messages, userMsg]); // fire-and-forget

      try {
        const aiMsg = await generateAIResponse([...messages, userMsg]);
        setMessages(prevMessages => [...prevMessages, aiMsg]);
        saveConversation([...messages, userMsg, aiMsg]); // fire-and-forget
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoadingConversation(false);
      }
    },
    [churchId, selectedCompanion, saveConversation, generateAIResponse, toast, messages]
  );

  const handleImageError = useCallback((id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  }, []);

// ...
  const handleCompanionSelect = useCallback((companion: ParishCompanion) => {
    setSelectedCompanion(companion);
    localStorage.setItem('parish_companion', JSON.stringify(companion));
    setIsCompanionModalOpen(false);
  }, []);

  // State for tracking survey submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit survey responses to the database
  const submitSurvey = async () => {
    setIsSubmitting(true);
    if (!churchId) {
      toast({
        title: "Error",
        description: "Church ID not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Check if there are any empty required responses
    const emptyResponses = textFieldResponses.filter(r => !r.response.trim());
    if (emptyResponses.length > 0) {
      toast({
        title: "Incomplete Survey",
        description: "Please complete all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get the authenticated user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Not authenticated');
      
      // Get the survey template id using church_id field
      const { data: templates } = await supabase
        .from('survey_templates')
        .select('id')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('Found survey templates using church_id field:', templates);
      
      if (!templates || templates.length === 0) throw new Error('Survey template not found');
      
      const templateId = templates[0].id;
      
      // Create a user_survey entry
      const { data: userSurvey, error: userSurveyError } = await supabase
        .from('user_surveys')
        .insert({
          user_id: userData.user.id,
          survey_template_id: templateId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            conversation: messages.filter(m => m.role !== 'system') // Store the conversation history
          }
        })
        .select('id')
        .single();
      
      if (userSurveyError) throw userSurveyError;
      
      // Map responses to their original question IDs and prepare for database insertion
      const allResponses = [];
      
      for (const response of textFieldResponses) {
        if (response.question_id && response.response.trim()) {
          allResponses.push({
            user_survey_id: userSurvey.id,
            question_id: response.question_id,
            response: response.response
          });
        }
      }
      
      // Save all responses
      if (allResponses.length > 0) {
        const { error: responsesError } = await supabase
          .from('survey_responses')
          .insert(allResponses);
        
        if (responsesError) throw responsesError;
      }
      
      toast({
        title: "Success",
        description: "Your survey responses have been submitted. Thank you!",
      });
      
      // Navigate to a thank you page or back to home
      setTimeout(() => {
        navigate('/thank-you');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving responses:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the survey section based on survey structure
  const renderSurveySection = () => {
    if (!surveyStructure) {
      return (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Parish History</h3>
            <Textarea 
              id="parishInput1" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Share information about your parish's history and founding..."
              value={textInputs.input1}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input1', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Community Demographics</h3>
            <Textarea 
              id="parishInput2" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe the demographics of your parish community..."
              value={textInputs.input2}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input2', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Current Ministries</h3>
            <Textarea 
              id="parishInput3" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="List your parish's current ministries and programs..."
              value={textInputs.input3}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input3', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Future Vision</h3>
            <Textarea 
              id="parishInput4" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe your vision for the parish's future..."
              value={textInputs.input4}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input4', e.target.value)}
            />
          </div>
        </div>
      );
    }

    // Determine if we're in a text field section or conversational section
    const textFieldSectionCount = surveyStructure["text field section"]?.length || 0;
    
    if (isTextFieldSection && currentSection < textFieldSectionCount) {
      // Render text field section
      const section = surveyStructure["text field section"][currentSection];
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.question}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="response">{section.question}</Label>
                <Textarea 
                  id="response" 
                  placeholder={section.sample_text}
                  className="min-h-[150px]"
                  value={textFieldResponses.find(
                    r => r.sectionTitle === section.title && r.fieldHeader === section.question
                  )?.response || ''}
                  onChange={(e) => handleTextFieldChange(section.title, section.question, e.target.value)}
                />
              </div>
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevSection}
                  disabled={currentSection === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentSection === (surveyStructure["text field section"]?.length || 0) - 1 ? (
                  <Button onClick={submitSurvey} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Survey'} {isSubmitting ? <span className="ml-2 h-4 w-4 animate-spin">⏳</span> : <CheckCircle className="ml-2 h-4 w-4" />}
                  </Button>
                ) : (
                  <Button onClick={handleNextSection}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // Render conversational section
      const sectionIndex = currentSection - textFieldSectionCount;
      const section = surveyStructure["conversational section"][sectionIndex];
      
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.conversation_prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.text_fields.map((field, idx) => (
                <div key={idx} className="mb-4">
                  <Label htmlFor={`field-${idx}`}>{field.header}</Label>
                  <Textarea 
                    id={`field-${idx}`} 
                    placeholder={field.sample_text}
                    className="min-h-[100px]"
                    value={textFieldResponses.find(
                      r => r.sectionTitle === section.title && r.fieldHeader === field.header
                    )?.response || ''}
                    onChange={(e) => handleTextFieldChange(section.title, field.header, e.target.value)}
                  />
                </div>
              ))}
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevSection}
                  disabled={currentSection === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentSection >= (textFieldSectionCount + (surveyStructure["conversational section"]?.length || 0) - 1) ? (
                  <Button 
                    onClick={submitSurvey}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Survey'} {isSubmitting ? <span className="ml-2 h-4 w-4 animate-spin">⏳</span> : <CheckCircle className="ml-2 h-4 w-4" />}
                  </Button>
                ) : (
                  <Button onClick={handleNextSection}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };
  
  // Render the conversation container
  const renderConversationContainer = () => {
    return (
      <div className="h-[300px] bg-white rounded-xl shadow-sm border overflow-hidden mt-6">
        {loadingPrompt ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : (
          <ControlledConversationInterface
            messages={messages}
            isLoading={loadingConversation || loadingPrompt}
            onSendMessage={handleSendMessage}
            placeholderText={selectedCompanion ? `Message ${selectedCompanion.name}...` : 'Select a companion to begin...'}
          />
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Display companion information if selected */}
        {selectedCompanion && (
          <Card className="my-4">
            <CardContent className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{selectedCompanion.name.charAt(0)}</AvatarFallback>
                {selectedCompanion.avatar_url && (
                  <AvatarImage src={selectedCompanion.avatar_url} />
                )}
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{selectedCompanion.name}</h3>
                <p className="text-sm text-gray-500">{selectedCompanion.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show companion selection dialog */}
        <Dialog open={isCompanionModalOpen} onOpenChange={setIsCompanionModalOpen}>
          <DialogContent className="max-w-[350px] max-h-[70vh] overflow-y-auto p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Select a Companion</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-2 py-2">
              {companions.map((companion) => (
                <Button
                  key={companion.id}
                  variant="outline"
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => handleCompanionSelect(companion)}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback>{companion.name.charAt(0)}</AvatarFallback>
                    {companion.avatar_url && (
                      <AvatarImage src={companion.avatar_url} />
                    )}
                  </Avatar>
                  <span className="text-sm truncate">{companion.name}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Survey Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Parish Survey</h2>
          {surveyStructure ? (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              {currentSection !== null && renderSurveySection()}
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
              <p>Loading survey...</p>
              {loadingError && (
                <p className="text-red-500 mt-2">{loadingError}</p>
              )}
            </div>
          )}
        </div>

        {/* Conversation Container - Always display this */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Conversation</h2>
          {renderConversationContainer()}
        </div>

        {/* Select companion button if none selected */}
        {!selectedCompanion && (
          <div className="mt-4 text-center">
            <Button onClick={() => setIsCompanionModalOpen(true)}>
              Select a Parish Companion
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
