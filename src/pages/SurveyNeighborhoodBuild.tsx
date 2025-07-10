import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { SurveyPreview } from "@/components/SurveyPreview";
import { SurveyEditor } from "@/components/SurveyEditor";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/lib/supabase";
import { useOpenAI } from "@/hooks/useOpenAI";
import { v4 as uuidv4 } from 'uuid';

// Define the neighborhood system prompt as a fallback
const NEIGHBORHOOD_SYSTEM_PROMPT = `You are an expert survey designer helping create effective neighborhood surveys. Follow these guidelines:

1. Ask clarifying questions to understand survey goals
2. Suggest appropriate question types (multiple choice, rating scales, open-ended)
3. Help craft clear, unbiased questions
4. Recommend best practices for survey design
5. Keep responses concise and actionable

Start by asking what they hope to learn from their neighborhood.`;

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
    options?: string[];
    required: boolean;
  }>;
}

// Interface for SurveyEditor compatibility
interface SurveyEditorTemplate {
  id?: string;
  title: string;
  description: string;
  fields: Array<{
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
    label: string;
    required: boolean;
    options?: string[];
  }>;
}

const SurveyNeighborhoodBuild = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);
  const [generatedSurvey, setGeneratedSurvey] = useState<Survey | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [mode, setMode] = useState<'conversation' | 'editor' | 'preview'>('conversation');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [, setSystemPrompt] = useState<string>(NEIGHBORHOOD_SYSTEM_PROMPT);
  
  // Function to adapt survey questions to fields format for SurveyEditor
  const adaptSurveyToEditorFormat = (survey: Survey | null): SurveyEditorTemplate | null => {
    if (!survey) return null;
    
    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      fields: survey.questions.map(q => ({
        id: q.id,
        type: mapQuestionTypeToFieldType(q.type),
        label: q.text,
        required: q.required,
        options: q.options
      }))
    };
  };
  
  // Helper function to map question types to field types
  const mapQuestionTypeToFieldType = (type: 'text' | 'multiple_choice' | 'rating' | 'boolean'): 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' => {
    switch (type) {
      case 'text': return 'text';
      case 'multiple_choice': return 'radio';
      case 'rating': return 'select';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  };
  
  // Convert editor format back to survey format
  const adaptEditorFormatToSurvey = (editorData: SurveyEditorTemplate): Survey => {
    return {
      id: editorData.id || '',
      title: editorData.title,
      description: editorData.description,
      questions: editorData.fields.map(field => ({
        id: field.id,
        text: field.label,
        type: mapFieldTypeToQuestionType(field.type),
        options: field.options,
        required: field.required
      }))
    };
  };
  
  // Helper function to map field types back to question types
  const mapFieldTypeToQuestionType = (type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'): 'text' | 'multiple_choice' | 'rating' | 'boolean' => {
    switch (type) {
      case 'text': 
      case 'textarea': 
        return 'text';
      case 'radio': 
      case 'select': 
        return 'multiple_choice';
      case 'checkbox': 
        return 'boolean';
      default: 
        return 'text';
    }
  };

  // Fetch the user's church ID and system prompt
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      // Fetch church ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('[SurveyNeighborhoodBuild] Error fetching church ID:', profileError);
        return;
      }
      
      if (profileData?.church_id) {
        setChurchId(profileData.church_id);
      }
      
      // Fetch system prompt
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'survey_creation_neighborhood')
        .single();
      
      if (promptError) {
        console.error('[SurveyNeighborhoodBuild] Error fetching system prompt:', promptError);
        // Use the fallback prompt if there's an error
        return;
      }
      
      if (promptData?.prompt) {
        setSystemPrompt(promptData.prompt);
      }
    };
    
    fetchInitialData();
  }, [user]);
  
  // Setup auto-save functionality
  useEffect(() => {
    // Only run auto-save when in editor mode with a valid survey
    if (mode === 'editor' && generatedSurvey) {
      // Clear any existing auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set up a new auto-save timer (every 30 seconds)
      const timer = setTimeout(() => {
        if (generatedSurvey) {
          // Quietly save in the background
          saveSurveyTemplate(generatedSurvey)
            .then(savedSurvey => {
              setGeneratedSurvey(prev => prev ? { ...prev, id: savedSurvey.id } : null);
              setSurveyId(savedSurvey.id || '');
              toast({
                title: "Auto-saved",
                description: "Your survey has been automatically saved.",
                variant: "default"
              });
            })
            .catch(error => {
              console.error('Auto-save failed:', error);
              // Silent fail for auto-save
            });
        }
      }, 30000); // 30 seconds
      
      setAutoSaveTimer(timer);
      
      // Clean up timer on unmount or mode change
      return () => {
        clearTimeout(timer);
        setAutoSaveTimer(null);
      };
    } else if (autoSaveTimer) {
      // Clean up timer if we're not in editor mode anymore
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
  // Remove autoSaveTimer from dependencies to prevent infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, generatedSurvey, churchId]);

  const handleConversationUpdate = (messages: Message[]) => {
    setSurveyConversation(messages);
  };

  const handleError = (error: Error) => {
    console.error('Error in conversation:', error);
    toast({
      title: "Error",
      description: error.message || "An error occurred in the conversation.",
      variant: "destructive",
    });  
  };

  const generateSurveyFromConversation = useCallback(async (conversation: Message[]) => {
    try {
      // Format the conversation for the OpenAI API
      const conversationText = conversation
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n\n');
      
      // Create a system prompt for survey generation
      const systemPrompt = `You are an expert survey designer. Based on the following conversation, generate a survey in JSON format with the following structure:
      
      {
        "title": "Survey Title",
        "description": "Brief description of the survey",
        "questions": [
          {
            "id": "unique_id_1",
            "text": "Question text",
            "type": "text|multiple_choice|rating|boolean",
            "options": ["Option 1", "Option 2"], // Only for multiple_choice
            "required": true|false
          }
        ]
      }
      
      Guidelines:
      - Include 5-10 questions
      - Mix question types appropriately
      - Make questions clear and concise
      - Ensure the survey flows logically
      - Include a mix of required and optional questions
      - Focus on gathering actionable insights
      
      Conversation:
      ${conversationText}`;
      
      // Call the OpenAI API
      const response = await generateResponse({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please generate a survey based on the conversation.' }
        ],
        maxTokens: 2000,
        temperature: 0.7
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Extract the JSON from the response
      const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || 
                       response.text.match(/```\n([\s\S]*?)\n```/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : response.text;
      
      // Parse the JSON response
      const surveyData = JSON.parse(jsonString);
      
      // Ensure the response has the expected structure
      if (!surveyData.questions || !Array.isArray(surveyData.questions)) {
        throw new Error('Invalid survey format generated');
      }
      
      // Add IDs to questions if they don't have them
      const processedQuestions = surveyData.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        required: q.required !== undefined ? q.required : true
      }));
      
      return {
        id: uuidv4(),
        title: surveyData.title || 'Neighborhood Community Survey',
        description: surveyData.description || 'Help us understand how we can better serve our community by completing this short survey.',
        questions: processedQuestions
      };
    } catch (error) {
      console.error('Error generating survey:', error);
      throw new Error('Failed to generate survey. Please try again.');
    }
  }, [generateResponse]);

  // Function to save survey template to database
  const saveSurveyTemplate = async (survey: Survey): Promise<Survey> => {
    try {
      if (!user?.id) throw new Error('User ID is required to save survey');
      if (!churchId) throw new Error('Church ID is required to save survey');
      
      const surveyPayload = {
        title: survey.title,
        description: survey.description,
        created_by: user.id,
        metadata: {
          survey_type: 'neighborhood',
          template_data: survey,
          church_id: churchId
        },
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (surveyId) {
        // Update existing survey
        const { data, error } = await supabase
          .from('survey_templates')
          .update(surveyPayload)
          .eq('id', surveyId)
          .select('*')
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new survey
        const { data, error } = await supabase
          .from('survey_templates')
          .insert([surveyPayload])
          .select('*')
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return {
        ...survey,
        id: result.id
      };
    } catch (error) {
      console.error('Error saving survey template:', error);
      throw error;
    }
  };
  
  const handleProduceSurvey = useCallback(async () => {
    if (!surveyConversation.length) {
      toast({
        title: "No conversation to process",
        description: "Please have a conversation first before generating a survey.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate survey from conversation using OpenAI
      const survey = await generateSurveyFromConversation(surveyConversation);
      
      // Set the generated survey
      setGeneratedSurvey(survey);
      
      // Save the survey to get an ID
      try {
        const savedSurvey = await saveSurveyTemplate(survey);
        setSurveyId(savedSurvey.id);
        
        // Generate shareable URL
        const baseUrl = window.location.origin;
        const shareableUrl = `${baseUrl}/neighborhood-survey/${savedSurvey.id}`;
        setSurveyUrl(shareableUrl);
        
        toast({
          title: "Survey Generated",
          description: "Your neighborhood survey has been created successfully!",
        });
        
        // Switch to editor mode after a short delay
        setTimeout(() => {
          setMode('editor');
        }, 1500);
      } catch (error: any) {
        console.error('Error saving initial survey:', error);
        // Continue even if save fails - we'll try again later
        toast({
          title: "Survey Generated",
          description: "Survey created but couldn't be saved. You can try saving again later.",
          variant: "default"
        });
        
        // Still switch to editor mode
        setMode('editor');
      }
    } catch (error: any) {
      console.error('Error generating survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [surveyConversation, churchId, generateSurveyFromConversation]);
  
  const handleCopyUrl = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl);
      setIsCopied(true);
      
      toast({
        title: "URL Copied",
        description: "Survey URL copied to clipboard!",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  

  
  // This function is used both by the SurveyEditor and SurveyPreview components
  const handleSaveSurvey = async (editorData: SurveyEditorTemplate): Promise<any> => {
    // Convert from editor format back to survey format
    const survey = adaptEditorFormatToSurvey(editorData);
    setIsSaving(true);
    
    try {
      const savedSurvey = await saveSurveyTemplate(survey);
      
      // Update the local state with the saved survey
      setGeneratedSurvey(savedSurvey);
      setSurveyId(savedSurvey.id);
      
      // Generate a shareable URL for the survey
      const surveyUrl = `${window.location.origin}/neighborhood-survey/${savedSurvey.id}`;
      setSurveyUrl(surveyUrl);
      
      toast({
        title: "Success",
        description: "Survey saved successfully!",
      });
      
      // Navigate back to ClergyMainPage after successful save
      setTimeout(() => {
        navigate('/clergy-main');
      }, 1500); // Short delay to allow the toast to be seen
      
      return { success: true };
    } catch (error: any) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey. Please try again.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  };

  // Handle closing the preview modal
  const handleClosePreview = () => {
    setGeneratedSurvey(null);
    // Navigate to the clergy home page
    navigate('/clergy-home');
  };

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access this page.</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  if ((mode === 'editor' || mode === 'preview') && generatedSurvey) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => setMode('conversation')}
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Conversation
          </Button>
          
          {mode === 'editor' && (
            <Button
              variant="outline"
              onClick={() => setMode('preview')}
              disabled={isSaving}
            >
              Preview Survey
            </Button>
          )}
          
          {mode === 'preview' && (
            <Button
              variant="outline"
              onClick={() => setMode('editor')}
              disabled={isSaving}
            >
              Edit Survey
            </Button>
          )}
        </div>
        
        {isSaving && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving your survey...
          </div>
        )}
        
        {surveyUrl && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Share Your Survey</h3>
            <div className="flex items-center">
              <input 
                type="text" 
                value={surveyUrl} 
                readOnly 
                className="flex-1 p-2 border border-gray-300 rounded-l-md bg-white text-sm"
              />
              <Button 
                onClick={handleCopyUrl} 
                className="rounded-l-none bg-blue-600 hover:bg-blue-700"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy URL
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Share this URL with your neighborhood to collect responses.
            </p>
          </div>
        )}
        
        {mode === 'editor' ? (
          <SurveyEditor
            initialData={adaptSurveyToEditorFormat(generatedSurvey) as SurveyEditorTemplate}
            onSave={(data) => {
              handleSaveSurvey(data as SurveyEditorTemplate);
              return Promise.resolve();
            }}
            onCancel={() => !isSaving && setMode('conversation')}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">{generatedSurvey.title}</h1>
              <p className="text-gray-600">{generatedSurvey.description}</p>
            </div>
            
            <div className="space-y-6">
              {generatedSurvey.questions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="mb-2 flex items-start">
                    <span className="font-medium mr-1">{index + 1}.</span>
                    <span className="font-medium">{question.text}</span>
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  
                  {question.type === 'text' && (
                    <input 
                      type="text" 
                      disabled 
                      placeholder="Text answer" 
                      className="w-full max-w-md p-2 border border-gray-300 rounded" 
                    />
                  )}
                  
                  {question.type === 'text' && question.text.length > 100 && (
                    <textarea 
                      disabled 
                      placeholder="Long answer" 
                      className="w-full max-w-md p-2 border border-gray-300 rounded h-24" 
                    />
                  )}
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="radio" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'boolean' && (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" disabled className="mr-2" />
                        <span>Yes</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" disabled className="mr-2" />
                        <span>No</span>
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'rating' && (
                    <select disabled className="w-full max-w-md p-2 border border-gray-300 rounded">
                      <option value="">Select a rating</option>
                      {question.options && question.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                      {!question.options && [
                        <option key="1" value="1">1</option>,
                        <option key="2" value="2">2</option>,
                        <option key="3" value="3">3</option>,
                        <option key="4" value="4">4</option>,
                        <option key="5" value="5">5</option>
                      ]}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
          {/* Back button above the header */}
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clergy-home')}
              className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Neighborhood Survey Builder</h1>
          </div>
          <div className="flex space-x-4">
            <Button 
              onClick={handleProduceSurvey}
              disabled={isGenerating || !surveyConversation.length}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Survey
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Build your neighborhood survey by conversing with Conversation Companion
              </h2>
              <p className="text-gray-600 mb-6">
              Start typing your questions in the text box below to begin building your survey.  Type in your goals and questions for your neighborhood survey. Your Companion will help you craft 
                effective questions to gather the information you need.
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <ConversationInterface 
                  onMessageUpdate={handleConversationUpdate}
                  onError={handleError}
                  systemPrompt={NEIGHBORHOOD_SYSTEM_PROMPT}
                  initialMessage="Welcome to the Neighborhood Survey Builder! I'll help you create an effective survey to understand your local community. What would you like to learn about your neighborhood?"
                  className="h-[60vh]"
                  companionName={selectedCompanion?.companion || 'Companion'}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Survey Preview Modal */}
      {generatedSurvey && mode === 'conversation' && (
        <SurveyPreview
          survey={generatedSurvey}
          onClose={handleClosePreview}
          onSave={(survey) => {
            handleSaveSurvey(survey as SurveyEditorTemplate)
              .then(() => setMode('editor'))
              .catch(err => console.error('Error saving survey:', err));
            return Promise.resolve({ success: true });
          }}
          surveyId={surveyId || undefined}
          churchId={churchId || undefined}
          isEditable={true}
        />
      )}
    </div>
  );
};

export default SurveyNeighborhoodBuild;
