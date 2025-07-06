import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { SurveyPreview } from "@/components/SurveyPreview";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/lib/supabase";
import { useOpenAI } from "@/hooks/useOpenAI";
import { v4 as uuidv4 } from 'uuid';

const NEIGHBORHOOD_SYSTEM_PROMPT = `You are an expert in neighborhood research and community engagement, helping churches understand their local community. Follow these guidelines:

1. Ask questions to understand the church's goals for neighborhood research
2. Suggest relevant demographic, cultural, and spiritual insights to explore
3. Help identify key community needs and assets
4. Recommend effective research methods (surveys, interviews, focus groups)
5. Provide guidance on analyzing and applying the findings

Start by asking about the church's neighborhood and what they hope to learn.`;

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

const SurveyNeighborhoodBuild = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);
  const [generatedSurvey, setGeneratedSurvey] = useState<Survey | null>(null);
  const [surveyId, setSurveyId] = useState<string>('');


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
        console.error('Error fetching church ID:', error);
        return;
      }

      if (data) {
        setChurchId(data.church_id);
      }
    };

    fetchChurchId();
  }, [user]);

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
      
      // We'll get the ID from the database after insertion
      
      // Save the survey to the new survey_templates table with proper metadata structure
      const { data, error } = await supabase
        .from('survey_templates')
        .insert([
          { 
            title: survey.title,
            description: survey.description,
            created_by: user?.id,
            metadata: {
              church_id: churchId,
              survey_type: 'neighborhood',
              template_data: {
                questions: survey.questions
              }
            },
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Get the ID from the inserted record
      const insertedId = data?.[0]?.id;
      
      if (!insertedId) {
        throw new Error('Failed to get survey ID from database');
      }
      
      // Set the generated survey and ID
      setGeneratedSurvey(survey);
      setSurveyId(insertedId);
      
      toast({
        title: "Survey Generated",
        description: "Your neighborhood survey has been created successfully!",
      });
      
      // Navigate to the survey summary page after a short delay
      setTimeout(() => {
        navigate(`/surveys/${insertedId}/summary`);
      }, 1500);
      
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
  }, [surveyConversation, churchId, generateSurveyFromConversation]);

  // Save survey changes to database
  const handleSaveSurvey = async (updatedSurvey: any) => {
    if (!surveyId) return;
    
    try {
      // Update the survey template in the database
      const { error } = await supabase
        .from('survey_templates')
        .update({
          title: updatedSurvey.title,
          description: updatedSurvey.description,
          metadata: {
            church_id: churchId,
            template_data: updatedSurvey.questions
          }
        })
        .eq('id', surveyId);
      
      if (error) throw error;
      
      // Update the local state with the edited survey
      setGeneratedSurvey(updatedSurvey);
      
      return;
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey. Please try again.",
        variant: "destructive"
      });
      throw error;
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Neighborhood Survey Builder</h1>
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
                Build your neighborhood survey by conversing with our AI assistant
              </h2>
              <p className="text-gray-600 mb-6">
                Discuss the goals and questions for your neighborhood survey. The AI will help you craft 
                effective questions to gather the information you need.
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <ConversationInterface 
                  onMessageUpdate={handleConversationUpdate}
                  onError={handleError}
                  systemPrompt={NEIGHBORHOOD_SYSTEM_PROMPT}
                  initialMessage="Welcome to the Neighborhood Survey Builder! I'll help you create an effective survey to understand your local community. What would you like to learn about your neighborhood?"
                  className="h-[60vh]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Survey Preview Modal */}
      {generatedSurvey && (
        <SurveyPreview
          survey={generatedSurvey}
          onClose={handleClosePreview}
          onSave={handleSaveSurvey}
          surveyId={surveyId}
          churchId={churchId}
          isEditable={true}
        />
      )}
    </div>
  );
};

export default SurveyNeighborhoodBuild;
