import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { Companion as ConversationCompanion } from "@/types/Companion";
import { SurveyEditor } from "@/components/SurveyEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, ArrowLeft, Save, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/lib/supabase";
import { useOpenAI } from "@/hooks/useOpenAI";

type FieldType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';

interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface SurveyTemplate {
  id?: string;
  title: string;
  description: string;
  fields: Field[];
  created_by?: string;
  church_id?: string;
  metadata?: any;
}

// State to store the system prompt

import jsPDF from "jspdf";


const SurveyBuild = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);
  const [surveyTemplate, setSurveyTemplate] = useState<SurveyTemplate | null>(null);
  const [mode, setMode] = useState<'conversation' | 'editor' | 'preview'>('conversation');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  
  // Print/download PDF for current survey template
  const handleDownloadPdf = () => {
    if (!surveyTemplate) return;
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text(surveyTemplate.title || 'Survey', 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(surveyTemplate.description || '', 10, y, { maxWidth: 190 });
    y += 30;

    (surveyTemplate.fields || []).forEach((field: Field, index: number) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${field.label}`, 10, y);
      y += 8;
      if ((field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && field.options) {
        doc.setFontSize(12);
        field.options.forEach((option: string) => {
          doc.text(`- ${option}`, 15, y);
          y += 6;
        });
      }
      y += 10;
    });

    doc.save(`${(surveyTemplate.title || 'survey').replace(/\s+/g, '_').toLowerCase()}_survey.pdf`);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        console.error('[SurveyBuild] Error fetching church ID:', profileError);
        return;
      }
      
      if (profileData?.church_id) {
        setChurchId(profileData.church_id);
      }
      
      // Fetch system prompt
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'survey_creation')
        .single();
      
      if (promptError) {
        console.error('[SurveyBuild] Error fetching system prompt:', promptError);
        // Set a fallback prompt in case of error
        setSystemPrompt("You are an expert survey designer helping church leaders create effective community surveys. Ask clarifying questions and suggest appropriate question types.");
        return;
      }
      
      if (promptData?.prompt) {
        setSystemPrompt(promptData.prompt);
      }
    };
    
    fetchInitialData();
  }, [user]);

  // Check if user is authenticated and has the Clergy role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    const checkUserRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('[SurveyBuild] Error fetching user role:', error);
        navigate("/unauthorized");
        return;
      }
      
      if (data?.role !== 'Clergy') {
        console.error('[SurveyBuild] Unauthorized access attempt by role:', data?.role);
        navigate("/unauthorized");
        return;
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, navigate, user]);

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
  
  // Setup auto-save functionality
  useEffect(() => {
    // Only run auto-save when in editor mode with a valid template
    if (mode === 'editor' && surveyTemplate) {
      // Clear any existing auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set up a new auto-save timer (every 30 seconds)
      const timer = setTimeout(() => {
        if (surveyTemplate) {
          // Quietly save in the background
          saveSurveyTemplate(surveyTemplate)
            .then(savedSurvey => {
              setSurveyTemplate(prev => prev ? { ...prev, id: savedSurvey.id } : null);
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
  }, [mode, surveyTemplate]);

  const handleSaveSurvey = async (template: SurveyTemplate) => {
    try {
      setIsSaving(true);
      const savedSurvey = await saveSurveyTemplate(template);
      
      toast({
        title: "Success",
        description: "Survey saved successfully.",
      });
      navigate('/survey-summary');
      
      // Update the template with the saved ID
      setSurveyTemplate(prev => prev ? { ...prev, id: savedSurvey.id } : null);
      
      // Navigate to ClergyHomePage after successful save
      setTimeout(() => {
        navigate('/clergy-home');
      }, 1500); // Short delay to show success message
      
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreviewToggle = () => {
    if (mode === 'editor') {
      setMode('preview');
    } else if (mode === 'preview') {
      setMode('editor');
    }
  };
  
  const parseSurveyFromAIResponse = (text: string): Omit<SurveyTemplate, 'id'> => {
    try {
      // Try to extract JSON if the response contains markdown or other text
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```([\s\S]*?)```/);
                      
      const jsonContent = jsonMatch ? jsonMatch[1] : text;
      const surveyData = JSON.parse(jsonContent);
      
      // Transform the fields to match our Field type
      const fields: Field[] = (surveyData.fields || []).map((field: any) => ({
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: (field.type || 'text') as FieldType,
        label: field.label || 'Untitled Question',
        required: field.required || false,
        options: field.options || (['radio', 'checkbox', 'select'].includes(field.type) ? ['Option 1'] : undefined)
      }));
      
      return {
        title: surveyData.title || 'New Survey',
        description: surveyData.description || '',
        fields
      };
    } catch (e) {
      console.error('Failed to parse survey JSON:', e);
      throw new Error('Failed to parse survey template');
    }
  };

  const saveSurveyTemplate = async (template: SurveyTemplate): Promise<SurveyTemplate> => {
    if (!user?.id) throw new Error('User ID is required to save survey');
    if (!churchId) throw new Error('Church ID is required to save survey');
    
    try {
      let result;
      const surveyPayload = {
        title: template.title,
        description: template.description,
        created_by: user.id,
        metadata: {
          survey_type: 'parish',
          template_data: template,
          church_id: churchId
        },
        updated_at: new Date().toISOString()
      };
      
      if (template.id) {
        // Update existing survey
        const { data, error } = await supabase
          .from('survey_templates')
          .update(surveyPayload)
          .eq('id', template.id)
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
      
      return result as SurveyTemplate;
    } catch (error) {
      console.error('Error saving survey template:', error);
      throw error;
    }
  };

  const handleBuildSurvey = async () => {
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
      // Format conversation messages for OpenAI
      const messages = [
        { 
          role: 'system' as const, 
          content: `You are a survey generator for church communities. Create a JSON survey template with the following structure:
{
  "title": "Survey Title",
  "description": "Survey description",
  "fields": [
    {
      "type": "text|select|radio|checkbox|textarea",
      "label": "Question text",
      "required": true|false,
      "options": ["Option 1", "Option 2"] // Only for select, radio, checkbox
    }
  ]
}

Based on the conversation, create appropriate survey questions.`
        },
        ...surveyConversation.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))
      ];
      
      // Use the useOpenAI hook to generate the survey
      const response = await generateResponse({
        messages,
        maxTokens: 2000,
        temperature: 0.7
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Parse the AI response into a survey template
      const newTemplate = parseSurveyFromAIResponse(response.text);
      setSurveyTemplate(newTemplate);
      
      // Switch to editor mode
      setMode('editor');
      
      toast({
        title: "Success",
        description: "Survey template created! You can now edit it.",
      });
      
    } catch (error) {
      console.error('Error generating survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  if ((mode === 'editor' || mode === 'preview') && surveyTemplate) {
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
          
          <Button
            variant="outline"
            onClick={handlePreviewToggle}
            disabled={isSaving}
          >
            {mode === 'editor' ? 'Preview Survey' : 'Edit Survey'}
          </Button>
        </div>
        
        {isSaving && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving your survey...
          </div>
        )}
        
        {mode === 'editor' ? (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isSaving}
              >
                Print
              </Button>
            </div>
            <SurveyEditor
              initialData={surveyTemplate}
              onSave={handleSaveSurvey}
              onCancel={() => !isSaving && setMode('conversation')}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">{surveyTemplate.title}</h1>
              <p className="text-gray-600">{surveyTemplate.description}</p>
            </div>
            
            <div className="space-y-6">
              {surveyTemplate.fields.map((field, index) => (
                <div key={field.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="mb-2 flex items-start">
                    <span className="font-medium mr-1">{index + 1}.</span>
                    <span className="font-medium">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  
                  {field.type === 'text' && (
                    <Input disabled placeholder="Text answer" className="max-w-md" />
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea disabled placeholder="Long answer" className="max-w-md" />
                  )}
                  
                  {field.type === 'radio' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="radio" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.type === 'checkbox' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="checkbox" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.type === 'select' && field.options && (
                    <select disabled className="w-full max-w-md p-2 border border-gray-300 rounded">
                      <option value="">Select an option</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
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

  // Rest of the component's return statement for conversation mode
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-8 sm:px-6 lg:px-8">
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Survey Builder</h1>
        </div>
        <div className="mb-8 text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Survey Builder</h1>
          <p className="text-gray-600">Create a survey to gather information from your community</p>
          <p className="mt-4 text-lg text-gray-600">
           Enter into conversation about the ideas and topics that you think are important and you will be guided through the survey building process using up-to-date research on survey construction.  When you are finished click the generate survey button and a survey will be sontructed that you can edit.  Members of the community can then complete the survey and results will be summarized for you.
         </p>

        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Survey Builder</h2>
            <p className="text-sm text-gray-500">Type in your goals and questions for your neighborhood survey. Your Companion will help you craft effective questions to gather the information you need.  Start typing your questions in the text box below to begin building your survey.</p>
          </div>
          
          <div>
            <ConversationInterface 
              onMessageUpdate={handleConversationUpdate}
              onError={handleError}
              systemPrompt={systemPrompt}
              initialMessage="Welcome to the Survey Builder! I'll help you create an effective survey for your community. What would you like to learn from your survey?"
              className="h-[60vh]"
              companionName={selectedCompanion?.companion || 'Companion'}
              selectedCompanion={selectedCompanion ? {
                id: selectedCompanion.UUID?.toString() || 'default-id',
                name: selectedCompanion.companion || 'Companion',
                description: selectedCompanion.traits || 'A helpful companion',
                avatar_url: selectedCompanion.avatar_url,
                companion_type: selectedCompanion.companion_type
              } : null}
            />
          </div>
        </div>
        
        {/* Add Generate Survey button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleBuildSurvey}
            disabled={isGenerating || !surveyConversation.length}
            size="lg"
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white font-bold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Survey...
              </>
            ) : (
              'Generate Survey'
            )}
          </Button>
        </div>
        
        <div className="mt-12 flex justify-between items-center p-6">
  <Button
    onClick={() => navigate('/clergy-home')}
    size="lg"
    variant="outline"
    className="text-lg px-8 py-6"
  >
    <ArrowLeft className="mr-2 h-5 w-5" />
    Home
  </Button>
  <Button
    onClick={() => navigate('/survey-summary')}
    size="lg"
    variant="default"
    className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white font-bold"
  >
    Next Steps
    <ArrowRight className="ml-2 h-5 w-5" />
  </Button>
</div>
      </div>
    </div>
  );
};

export default SurveyBuild;
