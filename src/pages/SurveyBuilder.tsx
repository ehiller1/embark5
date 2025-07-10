import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/lib/supabase";
import { useOpenAI } from "@/hooks/useOpenAI";
import { SurveyPreview } from "@/components/SurveyPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const SURVEY_SYSTEM_PROMPT = `You are an expert survey designer helping church leaders create effective community surveys. Follow these guidelines:

1. Ask clarifying questions to understand their survey goals
2. Suggest appropriate question types (multiple choice, rating scales, open-ended)
3. Help craft clear, unbiased questions
4. Recommend best practices for survey design
5. Keep responses concise and actionable

Start by asking what they hope to learn from their community.`;

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
}

const SurveyBuilder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedSurvey, setGeneratedSurvey] = useState<Survey | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);

  // Fetch the user's church ID
  useEffect(() => {
    const fetchChurchId = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('[SurveyBuilder] Error fetching church ID:', error);
        return;
      }
      
      if (data?.church_id) {
        setChurchId(data.church_id);
      }
    };
    
    fetchChurchId();
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
        console.error('[SurveyBuilder] Error fetching user role:', error);
        navigate("/unauthorized");
        return;
      }
      
      if (data?.role !== 'Clergy') {
        console.error('[SurveyBuilder] Unauthorized access attempt by role:', data?.role);
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

  const handlePreviewSurvey = async () => {
    if (!surveyConversation.length) {
      toast({
        title: "No conversation to process",
        description: "Please have a conversation first before generating a survey preview.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Format conversation messages for OpenAI
      const messages = [
        { 
          role: 'system', 
          content: `You are a survey generator for church communities. Create a JSON survey template with the following structure:
{
  "title": "Survey Title",
  "description": "Survey description",
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "type": "text|multiple_choice|rating|boolean",
      "required": true|false,
      "options": ["Option 1", "Option 2"] // Only for multiple_choice
    }
  ]
}

Based on the conversation, create appropriate survey questions.`
        },
        ...surveyConversation.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
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
      
      // Parse the response text as JSON
      let surveyData;
      try {
        // Try to extract JSON if the response contains markdown or other text
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || 
                         response.text.match(/```([\s\S]*?)```/);
                          
        const jsonContent = jsonMatch ? jsonMatch[1] : response.text;
        surveyData = JSON.parse(jsonContent);
      } catch (e) {
        console.error('Failed to parse survey JSON:', e);
        throw new Error('Failed to parse survey template');
      }
      
      // Ensure surveyData has required fields
      if (!surveyData.title) {
        surveyData.title = 'New Survey';
      }
      
      if (!surveyData.description) {
        surveyData.description = 'Generated from conversation';
      }
      
      if (!surveyData.questions || !Array.isArray(surveyData.questions)) {
        // If the API returned fields instead of questions, convert it
        if (surveyData.fields && Array.isArray(surveyData.fields)) {
          surveyData.questions = surveyData.fields.map((field: any) => {
            // Convert field structure to question structure
            return {
              id: field.id || `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: field.label || 'Question',
              type: convertFieldTypeToQuestionType(field.type),
              required: field.required || false,
              options: field.options || []
            };
          });
        } else {
          surveyData.questions = [];
        }
      }
      
      // Set the generated survey for preview
      setGeneratedSurvey(surveyData);
      setPreviewOpen(true);
      
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

  const convertFieldTypeToQuestionType = (fieldType: string): 'text' | 'multiple_choice' | 'rating' | 'boolean' => {
    switch (fieldType) {
      case 'select':
      case 'radio':
      case 'checkbox':
        return 'multiple_choice';
      case 'textarea':
      case 'text':
        return 'text';
      default:
        return 'text';
    }
  };

  const handleSaveSurvey = async (updatedSurvey: Survey): Promise<{success: boolean}> => {
    if (!user?.id) {
      throw new Error('User ID is required to save survey');
    }
    
    if (!churchId) {
      throw new Error('Church ID is required to save survey');
    }
    
    try {
      // Prepare survey data for saving
      const surveyTemplate = {
        title: updatedSurvey.title || 'New Survey',
        description: updatedSurvey.description || '',
        created_by: user.id,
        metadata: {
          survey_type: 'parish',
          template_data: updatedSurvey,
          church_id: churchId
        }
      };
      
      // If we have an existing survey ID, update it
      if (surveyId) {
        const { error } = await supabase
          .from('survey_templates')
          .update(surveyTemplate)
          .eq('id', surveyId);
          
        if (error) throw error;
      } else {
        // Otherwise create a new survey
        const { data, error } = await supabase
          .from('survey_templates')
          .insert(surveyTemplate)
          .select('id')
          .single();
          
        if (error) throw error;
        
        if (data) {
          setSurveyId(data.id);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving survey:', error);
      throw error;
    }
  };

  const handleBuildSurvey = async () => {
    if (!generatedSurvey) {
      toast({
        title: "No survey to save",
        description: "Please generate a survey preview first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await handleSaveSurvey(generatedSurvey);
      
      // Show success message
      toast({
        title: "Success",
        description: "Survey template created successfully!",
        variant: "default"
      });
      
      // Navigate to ClergyHomePage after successful survey creation
      navigate('/clergy-home');
      
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Survey Builder</h1>
          <p className="text-gray-600">Create a survey to gather information from your community</p>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Survey Builder</h2>
            <p className="text-sm text-gray-500">Start typing your questions in the text box below to begin building your survey.</p>
          </div>
          
          <div className="h-[60vh] overflow-hidden">
            {/* Use the ConversationInterface with custom initial message that includes instructions */}
            <ConversationInterface 
              onMessageUpdate={handleConversationUpdate}
              onError={handleError}
              systemPrompt={SURVEY_SYSTEM_PROMPT}
              initialMessage="Welcome to the Survey Builder! I'll help you create an effective community survey. Please describe what you'd like to learn from your community. Your input will be used to generate a customized survey. Be specific about the information you want to gather and any particular areas of interest. Some examples of what you might want to learn: community needs and challenges, spiritual interests and backgrounds, feedback on church programs or services, demographic information for ministry planning."
              className="h-[calc(60vh-56px)]"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            onClick={handlePreviewSurvey}
            disabled={!surveyConversation.length || isGenerating}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview Survey
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleBuildSurvey}
            disabled={!generatedSurvey || isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Save Survey
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Survey Preview Modal */}
      {generatedSurvey && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="p-0 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <SurveyPreview
              survey={generatedSurvey}
              onClose={() => setPreviewOpen(false)}
              onSave={(updatedSurvey: any) => {
                handleSaveSurvey(updatedSurvey);
                return Promise.resolve({ success: true });
              }}
              surveyId={surveyId || undefined}
              churchId={churchId || undefined}
              isEditable={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SurveyBuilder;
