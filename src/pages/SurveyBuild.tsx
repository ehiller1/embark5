import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/lib/supabase";
import { useOpenAI } from "@/hooks/useOpenAI";

const SURVEY_SYSTEM_PROMPT = `You are an expert survey designer helping church leaders create effective community surveys. Follow these guidelines:

1. Ask clarifying questions to understand their survey goals
2. Suggest appropriate question types (multiple choice, rating scales, open-ended)
3. Help craft clear, unbiased questions
4. Recommend best practices for survey design
5. Keep responses concise and actionable

Start by asking what they hope to learn from their community.`;

const SurveyBuild = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);

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
        console.error('[SurveyBuild] Error fetching church ID:', error);
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
          role: 'system', 
          content: `You are a survey generator for church communities. Create a JSON survey template with the following structure:
{
  "title": "Survey Title",
  "description": "Survey description",
  "fields": [
    {
      "id": "unique_id",
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
      
      // Validate required fields
      if (!user?.id) {
        console.error('User ID is missing');
        throw new Error('User ID is required to save survey');
      }
      
      if (!churchId) {
        console.error('Church ID is missing');
        throw new Error('Church ID is required to save survey');
      }
      
      // Ensure surveyData has required fields
      if (!surveyData.title) {
        surveyData.title = 'New Survey';
      }
      
      if (!surveyData.fields || !Array.isArray(surveyData.fields)) {
        console.error('Survey data is missing fields array');
        surveyData.fields = [];
      }
      
      // Log the data we're trying to save
      console.log('Saving survey template with data:', {
        title: surveyData.title || 'New Survey',
        description: surveyData.description || '',
        created_by: user?.id,
        church_id: churchId,
      });
      
      try {
        // Save the survey template to the survey_templates table
        const { data: survey, error: saveError } = await supabase
          .from('survey_templates')
          .insert({
            title: surveyData.title || 'New Survey',
            description: surveyData.description || '',
            created_by: user.id,
            metadata: {
              survey_type: 'parish',
              template_data: surveyData,
              church_id: churchId
            }
          })
          .select('*')
          .single();
          
        if (saveError) {
          console.error('Supabase error saving survey template:', saveError);
          throw new Error(`Failed to save survey template: ${saveError.message}`);
        }
        
        if (saveError) {
          console.error('Error saving survey template:', saveError);
          toast({
            title: "Error",
            description: "Error saving survey template",
            variant: "destructive"
          });
          return;
        }
        
        console.log('Successfully saved survey template:', survey);
        
        // Show success message
        toast({
          title: "Success",
          description: "Survey template created successfully!",
          variant: "default"
        });
        
        // Navigate to ClergyHomePage after successful survey creation
        navigate('/clergy-home');
        
      } catch (error) {
        console.error('Error in Supabase operation:', error);
        throw error;
      }
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Survey Builder</h1>
          <p className="text-gray-600">Create a survey to gather information from your community</p>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Conversation</h2>
            <p className="text-sm text-gray-500">Discuss the survey questions with the assistant</p>
          </div>
          
          <div className="h-[60vh] overflow-hidden">
            <ConversationInterface 
            onMessageUpdate={handleConversationUpdate}
            onError={handleError}
            systemPrompt={SURVEY_SYSTEM_PROMPT}
            initialMessage="Welcome to the Survey Builder! I'll help you create an effective community survey. What would you like to learn from your community?"
            className="h-full"
          />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleBuildSurvey}
            disabled={!surveyConversation.length || isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Survey
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyBuild;
