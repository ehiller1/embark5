import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/lib/supabase';
import { useOpenAI } from '@/hooks/useOpenAI';

interface SurveyData {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'multiple_choice' | 'rating';
    options?: string[];
    required: boolean;
  }>;
}

const NeighborhoodSurvey = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateResponse } = useOpenAI();
  
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsGenerating] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [churchId, setChurchId] = useState('');
  const [, setConversation] = useState<any[]>([]);

  // Parse conversation from location state
  useEffect(() => {
    if (location.state?.conversation) {
      setConversation(location.state.conversation);
      setChurchId(location.state.churchId || '');
      generateSurvey(location.state.conversation);
    } else {
      navigate('/survey-neighborhood-build');
    }
  }, [location.state, navigate]);

  const generateSurvey = async (conversation: any[]) => {
    if (!conversation?.length) return;

    setIsGenerating(true);
    
    try {
      // Format the conversation for the prompt
      const formattedConversation = conversation
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Generate survey using OpenAI
      const prompt = `Based on the following conversation, create a detailed neighborhood survey. 
      The survey should include relevant questions that would help gather information about the community. 
      Format the response as a JSON object with the following structure:
      {
        "title": "Survey Title",
        "description": "Brief description of the survey",
        "questions": [
          {
            "id": "unique_id_1",
            "question": "Question text",
            "type": "text | multiple_choice | rating",
            "options": ["Option 1", "Option 2"], // Only for multiple_choice type
            "required": true
          }
        ]
      }
      
      Conversation:
      ${formattedConversation}`;

      const response = await generateResponse({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      
      // Parse the response
      try {
        if (response.error) {
          throw new Error(response.error);
        }
        
        const responseText = response.text || '';
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('Invalid response format from AI');
        }
        
        const jsonString = responseText.substring(jsonStart, jsonEnd);
        const parsedData = JSON.parse(jsonString);
        
        // Add IDs to questions if not present
        const questionsWithIds = parsedData.questions.map((q: any) => ({
          ...q,
          id: q.id || `q${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setSurveyData({
          ...parsedData,
          questions: questionsWithIds
        });
        
        // Generate a unique URL for the survey
        const surveyId = `nbs_${Math.random().toString(36).substr(2, 9)}`;
        const url = `${window.location.origin}/take-survey/${surveyId}`;
        setSurveyUrl(url);
        
        // Save the survey to the database
        await saveSurvey({
          id: surveyId,
          church_id: churchId,
          title: parsedData.title,
          description: parsedData.description,
          questions: questionsWithIds,
          created_at: new Date().toISOString(),
          is_active: true,
          survey_type: 'neighborhood'
        });
        
      } catch (error) {
        console.error('Error parsing survey data:', error);
        toast({
          title: "Error",
          description: "Failed to generate survey. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating survey:', error);
      toast({
        title: "Error",
        description: "An error occurred while generating the survey.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const saveSurvey = async (survey: any) => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert([survey])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Error saving survey:', error);
      throw error;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-lg">Generating your neighborhood survey...</p>
        </div>
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Back button above the header */}
          <div className="mb-2 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clergy-home')}
              className="text-journey-pink hover:bg-journey-lightPink/20"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Your Survey is Ready!</h1>
            <p className="text-gray-600">Share this survey with your community to gather responses.</p>
          </div>
          <Button onClick={() => navigate('/survey-neighborhood-build')}>
            Back to Survey Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back button above the header */}
        <div className="mb-2 -ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clergy-home')}
            className="text-journey-pink hover:bg-journey-lightPink/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Your Survey is Ready!</h1>
          <p className="text-gray-600">Share this survey with your community to gather responses.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Survey Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveyData.questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <Label>
                    <>
                      {index + 1}. {q.question} {q.required && <span className="text-red-500">*</span>}
                    </>
                  </Label>
                  {q.type === 'text' && (
                    <Input type="text" placeholder="Your answer" disabled />
                  )}
                  {q.type === 'multiple_choice' && q.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input type="radio" id={`${q.id}-${i}`} name={q.id} disabled className="h-4 w-4" />
                      <label htmlFor={`${q.id}-${i}`} className="text-sm">{option}</label>
                    </div>
                  ))}
                  {q.type === 'rating' && (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="h-8 w-8 rounded-full border flex items-center justify-center">
                          {num}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Survey</CardTitle>
            <CardDescription>Copy the link below to share your survey with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input value={surveyUrl} readOnly className="flex-1" />
              <Button 
                onClick={copyToClipboard}
                variant={copied ? 'default' : 'outline'}
                className="w-24"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Anyone with this link will be able to take the survey</p>
          </CardContent>
        </Card>

        <div className="flex justify-between space-x-4">
          <Button variant="secondary" onClick={() => navigate('/clergy-home')}>
            Back to Home
          </Button>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => navigate('/survey-neighborhood-build')}>
              Back to Builder
            </Button>
            <Button onClick={() => window.open(surveyUrl, '_blank')}>
              View Live Survey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodSurvey;
