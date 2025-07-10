import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useNavigate, Link } from 'react-router-dom';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2, X } from 'lucide-react';
import { checkChurchProfileExists } from '@/utils/dbUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  role?: 'system' | 'user' | 'assistant'; // Make role optional as some messages use sender instead
  sender?: string; // Add sender property for compatibility with database format
  content: string;
  timestamp: string;
}

interface ConversationHistory {
  id: number;
  user_id: string;
  church_id: string;
  conversation_page: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  message_count?: number;
  conversation_history?: {
    messages: Message[];
  };
  text_field_responses?: Record<string, string>; // Add text field responses
}

interface SurveySummary {
  summary: {
    key_themes: string[];
    sentiment: {
      overall: string;
      summary_text: string;
    };
    potential_risks: {
      items: string[];
      number_of_persons_identifying_risks: number;
    };
    potential_opportunities: {
      items: string[];
      number_of_persons_identifying_opportunities: number;
    };
    dreams_and_aspirations: string[];
    fears_and_concerns: string[];
  };
}

interface Prompt {
  id: string;
  prompt_type: string;
  prompt_text?: string;
  prompt?: string;
  created_at: string;
}

const SurveySummaryPage = () => {
  const { user } = useUser();
  const { generateResponse } = useOpenAI();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [summaryData, setSummaryData] = useState<SurveySummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to handle opening the response modal
  const handleOpenResponseModal = (conversation: ConversationHistory) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  // Function to handle closing the response modal
  const handleCloseResponseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  // Define the fetchConversationHistory function
  const fetchConversationHistory = useCallback(async (churchId: string): Promise<ConversationHistory[]> => {
    if (!churchId) {
      console.error('[SurveySummary] No church ID provided');
      throw new Error('Church ID is required to fetch conversation history');
    }

    try {
      console.log('[SurveySummary] ---- DIAGNOSTICS START ----');

      // First check if the table exists and is accessible
      const { count: tableCount, error: tableError } = await supabase
        .from('conversation_history')
        .select('*', { count: 'exact', head: true });

      console.log('[SurveySummary] Table access check:', {
        success: !tableError,
        error: tableError,
        count: tableCount,
      });

      // Check current user auth status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('[SurveySummary] Current authenticated user:', {
        id: currentUser?.id,
        email: currentUser?.email,
        isAuthenticated: !!currentUser
      });

      // Super important: Check ALL conversation pages in the system
      console.log('[SurveySummary] Checking ALL conversation_pages in the database...');
      const { data: conversationPages, error: pagesError } = await supabase
        .from('conversation_history')
        .select('conversation_page')
        .limit(100); // Get a good sample

      if (pagesError) {
        console.error('[SurveySummary] Error checking conversation pages:', pagesError);
      } else {
        // Extract unique conversation page values
        const uniquePages = [...new Set(conversationPages?.map(p => p.conversation_page))];
        console.log('[SurveySummary] Available conversation_page values:', uniquePages);

        // If we found any pages, try querying each one specifically
        if (uniquePages.length > 0) {
          for (const pageName of uniquePages) {
            console.log(`[SurveySummary] Testing query with conversation_page="${pageName}"...`);
            const { data: pageData } = await supabase
              .from('conversation_history')
              .select('id, church_id, conversation_page, created_at')
              .eq('church_id', churchId)
              .eq('conversation_page', pageName)
              .limit(3);

            console.log(`[SurveySummary] Results for page "${pageName}":`, {
              found: (pageData && pageData.length > 0) || false,
              count: pageData?.length || 0
            });

            if (pageData && pageData.length > 0) {
              console.log(`[SurveySummary] Found data with conversation_page="${pageName}"!`);
              console.log('[SurveySummary] Sample:', pageData[0]);
              // If we found matching data, remember this page value for later queries
              if (pageName !== 'parish_survey') {
                console.log(`[SurveySummary] NOTE: The correct conversation_page appears to be "${pageName}" not "parish_survey"`);
              }
            }
          }
        }
      }

      // 1. Try with ONLY church_id filter
      console.log('[SurveySummary] Trying query with ONLY church_id...');
      const { data: churchData, error: churchError } = await supabase
        .from('conversation_history')
        .select('id, church_id, conversation_page, created_at')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      console.log('[SurveySummary] Church ID only query:', {
        success: !churchError,
        error: churchError,
        count: churchData?.length || 0,
        sample: churchData?.slice(0, 2) || []
      });

      // 2. Try with no filters (get all records)
      console.log('[SurveySummary] Trying query with NO filters to see all accessible records...');
      const { data: allRecords, error: allError, count: recordCount } = await supabase
        .from('conversation_history')
        .select('id, church_id, conversation_page, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('[SurveySummary] All records query:', {
        success: !allError,
        error: allError,
        count: recordCount || allRecords?.length || 0,
        sample: allRecords?.slice(0, 3) || [],
        uniquePages: allRecords ? [...new Set(allRecords.map(r => r.conversation_page))] : [],
        uniqueChurches: allRecords ? [...new Set(allRecords.map(r => r.church_id))] : [],
      });

      // 3. Try with exact parameters we need but with case variations
      console.log('[SurveySummary] Trying direct query with exact parameters...');

      // Log the exact values we're using for the query
      console.log('[SurveySummary] Query parameters:', {
        churchId,
        conversationPage: 'parish_survey'
      });

      // Try several variations of conversation_page
      const pageVariations = ['parish_survey', 'Parish_Survey', 'Parish Survey', 'PARISH_SURVEY', 'parish survey'];

      for (const pageVar of pageVariations) {
        console.log(`[SurveySummary] Trying with conversation_page = "${pageVar}"`);
        const { data: varData, error: varError } = await supabase
          .from('conversation_history')
          .select('*')
          .eq('church_id', churchId)
          .eq('conversation_page', pageVar)
          .order('created_at', { ascending: false });

        console.log(`[SurveySummary] Result for "${pageVar}":`, {
          success: !varError,
          error: varError,
          count: varData?.length || 0,
          found: (varData && varData.length > 0) || false
        });

        if (varData && varData.length > 0) {
          console.log(`[SurveySummary] Found data with conversation_page="${pageVar}"!`);
          console.log('[SurveySummary] ---- DIAGNOSTICS END ----');
          return varData as ConversationHistory[];
        }
      }

      // If we have any data from general queries, return that instead of empty
      if (churchData && churchData.length > 0) {
        console.log('[SurveySummary] Falling back to church_id only filter data');
        console.log('[SurveySummary] ---- DIAGNOSTICS END ----');
        return churchData as ConversationHistory[];
      }

      if (allRecords && allRecords.length > 0) {
        console.log('[SurveySummary] Falling back to all available records');
        console.log('[SurveySummary] ---- DIAGNOSTICS END ----');
        return allRecords as ConversationHistory[];
      }

      console.log('[SurveySummary] No data found with any query variation');
      console.log('[SurveySummary] ---- DIAGNOSTICS END ----');
      return [];
    } catch (error) {
      console.error('[SurveySummary] Error in fetchConversationHistory:', error);
      throw error;
    }
  }, []);

  // Function to fetch survey prompt
  const fetchSurveyPrompt = useCallback(async () => {
    try {
      console.log('[SurveySummary] Fetching survey_summary prompt...');
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('prompt_type', 'survey_summary')
        .single();

      if (error) {
        console.error('[SurveySummary] Error fetching survey prompt:', error);
        throw error;
      }

      if (!data) {
        console.error('[SurveySummary] No survey_summary prompt found');
        throw new Error('Survey prompt not found');
      }

      // Log the entire prompt object to see its structure
      console.log('[SurveySummary] Successfully retrieved prompt:', data);

      // Check which property contains the prompt text
      if (!data.prompt_text && data.prompt) {
        console.log('[SurveySummary] Using prompt property instead of prompt_text');
        data.prompt_text = data.prompt; // Copy prompt to prompt_text for consistent API
      }

      return data as Prompt;
    } catch (err) {
      console.error('[SurveySummary] Error in fetchSurveyPrompt:', err);
      throw err;
    }
  }, []);

  // Function to generate summary
  const generateSurveySummary = useCallback(async (conversations: ConversationHistory[], promptText: string) => {
    try {
      setIsGeneratingSummary(true);

      // Extract both conversation messages and text field responses from all conversations
      const surveyData = conversations.map(c => {
        // Get conversation messages
        const messages = c.conversation_history?.messages || c.messages || [];
        console.log('[SurveySummary] Messages format sample:', messages.length > 0 ? JSON.stringify(messages[0]).substring(0, 100) : 'No messages');

        const userMessages = messages
          .filter(m => m.role === 'user' || m.sender === 'user') // Handle both formats
          .map(m => `${m.content}`) // Just the content

        const conversationData = userMessages.join('\n');
        console.log('[SurveySummary] Found ' + userMessages.length + ' user messages in conversation');

        // Get text field responses if available
        let textFieldData = '';
        if (c.text_field_responses) {
          textFieldData = Object.entries(c.text_field_responses)
            .map(([questionId, response]) => `Question ID: ${questionId}, Response: ${response}`)
            .join('\n');
          console.log('[SurveySummary] Found text field responses:', Object.keys(c.text_field_responses).length);
        }

        // Combine both types of data
        return `--- Response ID: ${c.id} ---\n${textFieldData ? '\nText Field Responses:\n' + textFieldData + '\n' : ''}\nConversation Data:\n${conversationData}`;
      }).join('\n\n');

      // If survey data is empty, provide a placeholder message
      const finalSurveyData = (!surveyData || surveyData.trim() === '') 
        ? "No survey responses have been recorded yet."
        : surveyData;
        
      if (!surveyData || surveyData.trim() === '') {
        console.log('[SurveySummary] Warning: No survey responses found, using placeholder');
      }
      
      // Populate the prompt with conversation data
      // Check if promptText is defined before using it
      if (!promptText) {
        throw new Error('Prompt text is undefined');
      }
      
      // Log the prompt text for debugging
      console.log('[SurveySummary] Original prompt text starts with:', promptText.substring(0, 100) + '...');
      console.log('[SurveySummary] Survey data sample:', finalSurveyData.substring(0, 100) + '...');
      
      // Replace both possible placeholder formats
      const populatedPrompt = promptText
        .replace('{conversation_data}', finalSurveyData)
        .replace('$(message history)', finalSurveyData) // Old format with space
        .replace('$(message_history)', finalSurveyData); // New format with underscore
      
      console.log('[SurveySummary] Looking for placeholders: {conversation_data}, $(message history), $(message_history)');
      
      console.log('[SurveySummary] Populated prompt sample:', populatedPrompt.substring(0, 100) + '...');
      
      console.log('[SurveySummary] Generating summary with OpenAI...');
      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'You are a helpful survey analysis assistant that generates structured JSON summaries.' },
          { role: 'user', content: populatedPrompt }
        ]
      });
      
      if (!response.text) {
        throw new Error('No response received from OpenAI');
      }
      
      // Parse the response
      try {
        // Extract JSON from the response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/); 
        const jsonString = jsonMatch ? jsonMatch[0] : response.text;
        const summaryData = JSON.parse(jsonString) as SurveySummary;
        console.log('[SurveySummary] Successfully parsed summary data:', summaryData);
        return summaryData;
      } catch (parseError) {
        console.error('[SurveySummary] Error parsing summary JSON:', parseError);
        console.log('[SurveySummary] Raw response:', response.text);
        throw new Error('Failed to parse the AI response as JSON');
      }
    } catch (err) {
      console.error('[SurveySummary] Error generating summary:', err);
      throw err;
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [generateResponse]);
  
  // Load data when component mounts or user changes
  // Use a ref to track whether data has been loaded already to prevent infinite loops
  const dataLoadedRef = React.useRef(false);

  useEffect(() => {
    // Skip if there's no user or we're already loading
    if (!user || isLoading) return;
    
    // Create a single load instance to prevent multiple calls to OpenAI
    if (dataLoadedRef.current) return;
    
    const loadData = async () => {
      if (user.role !== 'Clergy') {
        setError('Access Denied: This page is for Clergy members only.');
        setIsLoading(false);
        return;
      }
      
      if (!user.church_id) {
        setError('No church associated with this account');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if a church profile exists before proceeding
        const hasChurchProfile = await checkChurchProfileExists(user.church_id);
        
        if (!hasChurchProfile) {
          setError('Please complete your church profile before accessing the survey summary.');
          setIsLoading(false);
          return;
        }
        
        // Fetch conversation history and survey responses
        const conversations = await fetchConversationHistory(user.church_id);
        
        // Fetch text field responses for each conversation if available
        const enhancedConversations = await Promise.all(conversations.map(async (conversation) => {
          try {
            // Query the survey_responses table to get text field responses
            const { data: responses } = await supabase
              .from('survey_responses')
              .select('response_data')
              .eq('user_id', conversation.user_id)
              .eq('church_id', user.church_id)
              .maybeSingle();
              
            if (responses && responses.response_data) {
              return {
                ...conversation,
                text_field_responses: responses.response_data
              };
            }
            return conversation;
          } catch (err) {
            console.error('[SurveySummary] Error fetching text field responses:', err);
            return conversation;
          }
        }));
        
        setConversations(enhancedConversations);
        
        if (conversations.length > 0) {
          // Fetch survey prompt
          const surveyPrompt = await fetchSurveyPrompt();
          
          // Use either prompt_text or prompt property as available
          const promptToUse = surveyPrompt.prompt_text || surveyPrompt.prompt || '';
          
          if (!promptToUse) {
            throw new Error('No prompt text found in the retrieved prompt');
          }
          
          console.log('[SurveySummary] Using prompt:', promptToUse.substring(0, 50) + '...');
          
          // Generate summary
          const summary = await generateSurveySummary(conversations, promptToUse);
          setSummaryData(summary);
        }
        
        // Mark that we've loaded the data
        dataLoadedRef.current = true;
        
      } catch (err) {
        console.error('Error fetching survey data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, isLoading, fetchConversationHistory, fetchSurveyPrompt, generateSurveySummary, checkChurchProfileExists]); // Include all dependencies used inside the effect

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading survey summary...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    // Special handling for church profile requirement error
    if (error === 'Please complete your church profile before accessing the survey summary.') {
      return (
        <div className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Church Profile Required</AlertTitle>
            <AlertDescription className="flex flex-col space-y-4">
              <p>{error}</p>
              <Button asChild className="w-fit">
                <Link to="/community-profile">Create Church Profile</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Show loading state for summary generation
  if (isGeneratingSummary) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Parish Survey Summary</h1>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Generating survey summary...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no conversations
  if (conversations.length === 0) {
    // Fallback summary data for sustainable ministry repurposing
    const fallbackSummary: SurveySummary = {
      summary: {
        key_themes: [
          'Sustainability and environmental stewardship',
          'Community engagement and outreach',
          'Financial viability and resource sharing',
          'Preserving spiritual mission while adapting space'
        ],
        sentiment: {
          overall: 'mostly positive',
          summary_text: 'The congregation is optimistic about repurposing church properties into sustainable ministries, with enthusiasm for environmental projects and community partnerships, though some express concerns about losing traditional identity.'
        },
        potential_risks: {
          items: [
            'Loss of historical or spiritual identity',
            'Insufficient funding or volunteer support',
            'Community resistance to change',
            'Regulatory or zoning challenges'
          ],
          number_of_persons_identifying_risks: 7
        },
        potential_opportunities: {
          items: [
            'Creation of community gardens and food programs',
            'Hosting sustainability workshops and events',
            'Partnerships with local nonprofits and schools',
            'Improved use of underutilized property spaces'
          ],
          number_of_persons_identifying_opportunities: 15
        },
        dreams_and_aspirations: [
          'To become a model for green ministry in the region',
          'To offer shelter and resources to those in need',
          'To engage youth in environmental projects',
          'To create an inclusive space for all community members'
        ],
        fears_and_concerns: [
          'That the church will lose its traditional character',
          'That projects will not be financially sustainable',
          'That older members may feel left out of new initiatives',
          'That partnerships may dilute the church’s mission'
        ]
      }
    };
    setSummaryData(fallbackSummary);
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No survey data found for your church. Displaying example summary:
          </AlertDescription>
        </Alert>
        {/* Render fallback summary cards */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Example: Community Opinion on Sustainable Ministry Repurposing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Key Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-base">
                  {fallbackSummary.summary.key_themes.map((theme, idx) => (
                    <li key={idx}>{theme}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 font-semibold">Overall: {fallbackSummary.summary.sentiment.overall}</div>
                <div>{fallbackSummary.summary.sentiment.summary_text}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-base">
                  {fallbackSummary.summary.potential_opportunities.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-muted-foreground">
                  {fallbackSummary.summary.potential_opportunities.number_of_persons_identifying_opportunities} identified
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-base">
                  {fallbackSummary.summary.potential_risks.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-muted-foreground">
                  {fallbackSummary.summary.potential_risks.number_of_persons_identifying_risks} identified
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dreams & Aspirations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-base">
                  {fallbackSummary.summary.dreams_and_aspirations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fears & Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-base">
                  {fallbackSummary.summary.fears_and_concerns.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-12">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/clergy-home')}
          className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Survey Summary</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {conversations.length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Messages per Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {conversations.length > 0
                  ? (conversations.reduce((sum, conv) => sum + (conv.conversation_history?.messages?.length || 0), 0) / conversations.length).toFixed(1)
                  : '0'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl">
                {conversations.length > 0
                  ? new Date(conversations[0].created_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Survey Summary Data */}
        {summaryData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Survey Summary</h2>
            
            {/* Key Themes */}
            <Card className="mb-6 border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" /> 
                  Key Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-2">
                  {summaryData.summary?.key_themes?.map((theme, index) => (
                    <li key={index} className="text-lg">{theme}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Sentiment */}
            <Card className="mb-6 border-l-4 border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-green-500" />
                  Overall Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Sentiment:</span>
                  <span className="capitalize bg-muted px-3 py-1 rounded-full text-sm">
                    {summaryData.summary?.sentiment?.overall || 'N/A'}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {summaryData.summary?.sentiment?.summary_text || 'No sentiment summary available'}
                </p>
              </CardContent>
            </Card>
            
            {/* Risks and Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Risks */}
              <Card className="border-l-4 border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Potential Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">
                    <span className="font-medium">People identifying risks:</span>{" "}
                    {summaryData.summary?.potential_risks?.number_of_persons_identifying_risks || 0}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.potential_risks?.items?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Opportunities */}
              <Card className="border-l-4 border-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-purple-500" />
                    Potential Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">
                    <span className="font-medium">People identifying opportunities:</span>{" "}
                    {summaryData.summary?.potential_opportunities?.number_of_persons_identifying_opportunities || 0}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.potential_opportunities?.items?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {/* Dreams and Fears */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dreams */}
              <Card className="border-l-4 border-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Dreams and Aspirations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.dreams_and_aspirations?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Fears */}
              <Card className="border-l-4 border-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Fears and Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.fears_and_concerns?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Responses List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Recent Responses</h2>
          
          {conversations.slice(0, 5).map((conversation) => (
            <Card 
              key={conversation.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleOpenResponseModal(conversation)}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Response #{conversation.id}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversation.conversation_history?.messages
                    ?.filter((msg) => msg.role === 'user')
                    .map((message, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg">
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-muted-foreground">{message.content}</p>
                      </div>
                    ))}
                </div>
                <div className="mt-4 text-sm text-blue-600 flex items-center justify-end">
                  <span>Click to view full response</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      
      {/* Modal rendered conditionally below */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Survey Response Details</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseResponseModal}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Response ID: {selectedConversation?.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on: {selectedConversation?.created_at ? new Date(selectedConversation.created_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Survey Conversation</h3>
                  
                  {selectedConversation?.conversation_history?.messages?.map((message, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}
                    >
                      <p className="font-medium mb-2">
                        {message.role === 'user' ? 'Respondent' : 'Survey System'}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCloseResponseModal}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SurveySummaryPage;
