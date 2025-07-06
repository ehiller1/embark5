import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { supabase } from '@/integrations/lib/supabase';
import { useOpenAI } from '@/hooks/useOpenAI';
import { SurveyResponseViewer } from '@/components/survey/SurveyResponseViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  created_at: string;
  metadata: {
    template_data: {
      fields: Array<{
        id: string;
        label: string;
        type: string;
        required?: boolean;
      }>;
    };
    survey_type: string;
    church_id: string;
  };
}

interface UserSurvey {
  id: string;
  user_id: string;
  survey_template_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  metadata: {
    conversation?: Array<{ role: string; content: string }>;
  };
}

interface SurveyResponse {
  id: string;
  user_survey_id: string;
  question_id: string;
  response: any;
  created_at: string;
}

interface FormattedResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  responses: Record<string, any>;
  conversation?: Array<{ role: string; content: string }>;
}

interface FormattedResponse {
  id: string;
  user_id: string;
  created_at: string;
  responses: Record<string, any>;
  conversation?: Array<{ role: string; content: string }>;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export default function SurveySummary() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || window.location.pathname.split('/').pop();
  const { user } = useAuth();
  const { generateResponse } = useOpenAI();
  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  // Track formatted responses directly instead of keeping raw data
  const [formattedResponses, setFormattedResponses] = useState<FormattedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingResponses, setAnalyzingResponses] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // Function to analyze survey responses with OpenAI
  const analyzeSurveyResponses = async (responses: FormattedResponse[]) => {
    if (!responses || responses.length === 0) return null;
    
    try {
      setAnalyzingResponses(true);
      
      // Prepare the data for OpenAI by combining conversation and text field responses
      const surveyData = responses.map(response => {
        // Get conversation data
        const conversationData = response.conversation
          ? response.conversation
              .filter(msg => msg.role === 'user')
              .map(msg => msg.content)
              .join('\n')
          : '';
        
        // Get text field responses
        const textFieldData = Object.entries(response.responses)
          .map(([questionId, answer]) => {
            // Find the question text for this ID
            const field = template?.metadata.template_data.fields.find(f => f.id === questionId);
            return field ? `Question: ${field.label}\nAnswer: ${answer}` : `Answer: ${answer}`;
          })
          .join('\n\n');
        
        // Combine both types of data
        return `--- Response from ${response.user?.name || 'Anonymous'} ---\n\n${textFieldData}\n\n${conversationData}`;
      }).join('\n\n---\n\n');
      
      // Create a prompt for the analysis
      const prompt = `Please analyze the following survey responses and provide a summary of key themes, sentiments, and insights. 
      Include both the text field responses and conversation data in your analysis.
      
      Survey responses:\n${surveyData}`;
      
      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'You are a helpful survey analysis assistant that provides insightful summaries of survey data.' },
          { role: 'user', content: prompt }
        ]
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.text;
    } catch (error) {
      console.error('Error analyzing survey responses:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze survey responses',
        variant: 'destructive',
      });
      return null;
    } finally {
      setAnalyzingResponses(false);
    }
  };

  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!id || !user?.id) return;
      
      // Get church_id from user metadata or default to empty string
      // Use type assertion to access the property safely
      const churchId = (user as any)?.church_id || '';

      try {
        // Fetch survey template
        const templateRes = await fetch(`/api/surveys/templates?id=${id}`, {
          headers: {
            'x-user-id': user.id,
            'x-church-id': churchId,
          },
        });

        if (!templateRes.ok) {
          throw new Error('Failed to fetch survey template');
        }

        const templateData = await templateRes.json();
        setTemplate(templateData.templates[0]);

        // Fetch user surveys for this template
        const { data: userSurveysData, error: userSurveysError } = await supabase
          .from('user_surveys')
          .select('*')
          .eq('survey_template_id', id)
          .order('created_at', { ascending: false });

        if (userSurveysError) {
          throw new Error('Failed to fetch user surveys');
        }

        // Fetch all responses for these user surveys
        if (userSurveysData && userSurveysData.length > 0) {
          const userSurveyIds = userSurveysData.map((us: UserSurvey) => us.id);
          
          const { data: responsesData, error: responsesError } = await supabase
            .from('survey_responses')
            .select('*')
            .in('user_survey_id', userSurveyIds);

          if (responsesError) {
            throw new Error('Failed to fetch survey responses');
          }
          
          // Format responses into a more usable structure
          const formatted = userSurveysData.map((userSurvey: UserSurvey) => {
            // Get all responses for this user survey
            const surveyResponses = responsesData?.filter(
              (response: SurveyResponse) => response.user_survey_id === userSurvey.id
            ) || [];
            
            // Convert array of responses to a key-value object
            const responseMap: Record<string, any> = {};
            surveyResponses.forEach((response: SurveyResponse) => {
              responseMap[response.question_id] = response.response;
            });
            
            return {
              id: userSurvey.id,
              user_id: userSurvey.user_id,
              created_at: userSurvey.created_at,
              completed_at: userSurvey.completed_at,
              status: userSurvey.status,
              responses: responseMap,
              conversation: userSurvey.metadata?.conversation || [],
            };
          });
          
          setFormattedResponses(formatted);
          
          // If we have responses, analyze them
          if (formatted.length > 0) {
            const analysisResult = await analyzeSurveyResponses(formatted);
            setAnalysis(analysisResult);
          }
        }
      } catch (error) {
        console.error('Error fetching survey data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load survey data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Survey not found</h1>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{template.title}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="responses">Responses ({formattedResponses.length})</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!analysis && !analyzingResponses}>Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Survey Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Title</h3>
                  <p>{template.title}</p>
                </div>
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p>{template.description || 'No description'}</p>
                </div>
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p>{format(new Date(template.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <h3 className="font-medium">Survey Type</h3>
                  <p className="capitalize">{template.metadata.survey_type}</p>
                </div>
                <div>
                  <h3 className="font-medium">Questions</h3>
                  <div className="grid gap-4 mt-2">
                    {template.metadata.template_data.fields.map((field: any, index: number) => (
                      <div key={field.id} className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <span className="font-medium">{index + 1}. {field.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {field.type} {field.required ? '(Required)' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          {formattedResponses.length > 0 ? (
            <SurveyResponseViewer responses={formattedResponses} template={template} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No responses yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Survey Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analyzingResponses ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Analyzing survey responses...</p>
                </div>
              ) : analysis ? (
                <div className="prose max-w-none">
                  {analysis.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No analysis available. Please check back later.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
