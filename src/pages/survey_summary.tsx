// src/pages/SurveySummaryPage.tsx

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
import { shouldShowDemoModals, shouldUseDemoData, getDemoChurchId } from '@/config/demoConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

// ----------- Interfaces ------------

interface Message {
  id: string;
  role?: 'system' | 'user' | 'assistant';
  sender?: string;
  content?: string;
  text?: string; // Alternative field name for content
  timestamp?: string;
  created_at?: string; // Alternative field name for timestamp
  [key: string]: any; // Allow for flexible structure
}

interface ConversationHistory {
  id: number;
  user_id: string;
  church_id: string;
  conversation_page: string;
  messages: Message[] | string; // Can be an array or a JSON string
  created_at: string;
  updated_at: string;
  message_count?: number;
  conversation_history?: {
    messages: Message[];
  };
  text_field_responses?: Record<string, string>;
  response_id?: string; // UUID reference to the survey_responses table
  [key: string]: any; // Allow for flexible structure
}

interface SurveySummary {
  // Direct properties for the new format
  key_themes?: string[];
  sentiment?: {
    overall: string;
    summary_text: string;
  };
  potential_risks?: {
    items: string[];
    count?: number;
  };
  potential_opportunities?: {
    items: string[];
    count?: number;
  };
  dreams_and_aspirations?: string[];
  fears_and_concerns?: string[];
  
  // Legacy format support
  summary?: {
    key_themes: string[];
    sentiment: {
      overall: string;
      summary_text: string;
    };
    potential_risks: {
      items: string[];
      count?: number;
      number_of_persons_identifying_risks?: number;
    };
    potential_opportunities: {
      items: string[];
      count?: number;
      number_of_persons_identifying_opportunities?: number;
    };
    dreams_and_aspirations?: string[] | string;
    fears_and_concerns?: string[] | string;
  };
}

interface Prompt {
  id: string;
  prompt_type: string;
  prompt_text?: string;
  prompt?: string;
  created_at: string;
}

// -------------- Component ---------------

// Local error boundary component to catch rendering errors
class LocalErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-500 rounded-md bg-red-50">
          <p className="text-red-600">Something went wrong rendering this component.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SurveySummaryPage = () => {
  const { user } = useUser();
  const { generateResponse } = useOpenAI();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [summaryData, setSummaryData] = useState<SurveySummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationHistory | null>(null);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false);
  const [selectedSurveyResponse, setSelectedSurveyResponse] = useState<SurveyResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal controls
  const handleOpenResponseModal = async (conversation: ConversationHistory) => {
    // Log the conversation structure to debug
    console.log('[SurveySummary] Opening modal with conversation:', JSON.stringify(conversation).substring(0, 200));
    
    // More detailed logging of message structure
    const hasMessages = Array.isArray(conversation.messages) && conversation.messages.length > 0;
    const hasConversationHistory = conversation.conversation_history && 
                                  typeof conversation.conversation_history === 'object';
    const hasNestedMessages = hasConversationHistory && 
                           Array.isArray(conversation.conversation_history.messages) &&
                           conversation.conversation_history.messages.length > 0;
                           
    console.log('[SurveySummary] Message structure details:', {
      hasDirectMessages: hasMessages,
      messagesLength: hasMessages ? conversation.messages.length : 0,
      hasConversationHistory: hasConversationHistory,
      hasNestedMessages: hasNestedMessages,
      nestedMessagesLength: hasNestedMessages ? conversation.conversation_history.messages.length : 0
    });
    
    // Make a deep copy to prevent any reference issues
    const conversationCopy = JSON.parse(JSON.stringify(conversation));
    setSelectedConversation(conversationCopy);
    
    // Find the corresponding survey responses for this conversation
    try {
      // The key is to match by user_id, which is the most reliable way to link conversations with survey responses
      console.log(`[SurveySummary] Querying survey_responses by user_id: ${conversation.user_id}`);
      
      const query = supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', conversation.user_id)
        .eq('church_id', conversation.church_id);
      
      // Additional debugging to help diagnose
      console.log(`[SurveySummary] Looking for survey_responses where:`)
      console.log(`- user_id: ${conversation.user_id}`)
      console.log(`- church_id: ${conversation.church_id}`);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SurveySummary] Error fetching survey response details:', error);
      } else if (data && data.length > 0) {
        console.log(`[SurveySummary] Found ${data.length} survey response(s) for user_id: ${conversation.user_id}`);
        console.log('[SurveySummary] Using survey response:', data[0]);
        
        // Log detailed response_data structure
        if (data[0].response_data) {
          console.log('[SurveySummary] Response data exists, type:', typeof data[0].response_data);
          
          // Handle if response_data comes as a JSON string that needs parsing
          let processedResponseData = data[0].response_data;
          
          if (typeof data[0].response_data === 'string') {
            try {
              console.log('[SurveySummary] Response data is a string, attempting to parse JSON');
              processedResponseData = JSON.parse(data[0].response_data);
              // Update the object with the parsed data
              data[0].response_data = processedResponseData;
              console.log('[SurveySummary] Successfully parsed response_data from string to object');
            } catch (parseError) {
              console.error('[SurveySummary] Failed to parse response_data JSON string:', parseError);
            }
          }
          
          console.log('[SurveySummary] Response data keys:', 
            typeof processedResponseData === 'object' ? Object.keys(processedResponseData) : 'Not an object');
          console.log('[SurveySummary] Response data sample:', 
            JSON.stringify(processedResponseData).substring(0, 200) + '...');
        } else {
          console.error('[SurveySummary] Response data is missing or null!');
        }
        
        setSelectedSurveyResponse(data[0]);
      } else {
        console.log('[SurveySummary] No matching survey response found for user_id:', conversation.user_id);
        setSelectedSurveyResponse(null);
      }
    } catch (error) {
      console.error('[SurveySummary] Failed to fetch survey response:', error);
    }
    
    setIsModalOpen(true);
  };
  const handleCloseResponseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  const diagnosticsRunRef = React.useRef(false);
  const surveyResponsesFetchedRef = React.useRef(false);
  const summaryGeneratedRef = React.useRef(false);

  // --------- Fetch Conversation History ---------

  const fetchConversationHistory = useCallback(async (churchId: string): Promise<ConversationHistory[]> => {
    if (!churchId) throw new Error('Church ID is required to fetch conversation history');
    
    console.log('[SurveySummary] Fetching conversation history for church:', churchId);
    
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[SurveySummary] Error fetching conversation history:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`[SurveySummary] Fetched ${data.length} conversation history records`);
      console.log('[SurveySummary] First conversation structure sample:', JSON.stringify(data[0]).substring(0, 300));
      
      // Process each conversation to ensure messages are properly extracted
      return data.map(conversation => {
        // Try to parse messages if they're stored as a string
        if (typeof conversation.messages === 'string') {
          try {
            conversation.messages = JSON.parse(conversation.messages);
            console.log('[SurveySummary] Successfully parsed messages from string for conversation:', conversation.id);
          } catch (e) {
            console.error(`[SurveySummary] Failed to parse messages string for conversation ${conversation.id}:`, e);
          }
        }
        
        // Check if messages are nested in conversation_history
        if (conversation.conversation_history && conversation.conversation_history.messages) {
          conversation.messages = conversation.conversation_history.messages;
        }
        
        return conversation;
      });
    }
    
    return data || [];
  }, []);
  
  // --------- Fetch Survey Responses ---------
  
  // Updated to match actual database structure
  interface SurveyResponse {
    id: string;
    church_id: string;
    response_data: Record<string, any> | string; // Can be an object or a JSON string
    created_at: string;
    updated_at?: string;
    user_id?: string;
  }
  
  const fetchSurveyResponses = useCallback(async (churchId: string): Promise<SurveyResponse[]> => {
    if (!churchId) throw new Error('Church ID is required to fetch survey responses');
    
    // Log to help debug the table structure
    console.log('[SurveySummary] Fetching survey responses for church:', churchId);
    
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[SurveySummary] Error fetching survey responses:', error);
      throw error;
    }
    
    // Log the first response to see structure
    if (data && data.length > 0) {
      console.log('[SurveySummary] First survey response structure:', data[0]);
    }
    
    return data || [];
  }, []);

  // --------- Fetch Survey Prompt ---------

  const fetchSurveyPrompt = useCallback(async (): Promise<string> => {
    const defaultPrompt = "Given all of the conversations: $(message_history) and survey responses $(survey_responses) summarize the messages into the following buckets: major themes, key passages, overall sentiment.";
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'survey_summary')
        .single();

      if (error || !data?.prompt) return defaultPrompt;
      return data.prompt;
    } catch (error) {
      console.error('[SurveySummary] Error fetching prompt:', error);
      return defaultPrompt;
    }
  }, []);

  // --------- Generate Survey Summary with OpenAI ---------

  const generateSurveySummary = useCallback(async (convs: ConversationHistory[], surveyResps: SurveyResponse[], promptText: string) => {
    try {
      setIsGeneratingSummary(true);
      
      // Format conversation history from the conversations table
      const conversationMessages = convs.reduce((acc: string[], c) => {
        // Handle the case where messages might be a string or an array
        let messagesArray: Message[] = [];
        
        // Get messages from conversation_history.messages if available
        if (c.conversation_history?.messages && Array.isArray(c.conversation_history.messages)) {
          messagesArray = c.conversation_history.messages;
        } 
        // Handle direct messages array
        else if (Array.isArray(c.messages)) {
          messagesArray = c.messages;
        } 
        // Try to parse messages if it's a string
        else if (typeof c.messages === 'string') {
          try {
            const parsedMessages = JSON.parse(c.messages);
            if (Array.isArray(parsedMessages)) {
              messagesArray = parsedMessages;
            }
          } catch (e) {
            console.error(`[SurveySummary] Failed to parse messages for conversation ${c.id}:`, e);
          }
        }
        
        // Filter and map messages to extract user content
        const userMessages = messagesArray
          .filter((m: Message) => m.role === 'user' || m.sender === 'user')
          .map((m: Message) => m.content || m.text || '');
        
        if (userMessages.length > 0) {
          acc.push(`--- Conversation ID: ${c.id} ---\n${userMessages.join('\n')}`);
        }
        return acc;
      }, []);
      
      // Format survey responses from the survey_responses table
      const formattedSurveyResponses = surveyResps.reduce((acc: { [key: string]: string[] }, response) => {
        if (!acc[response.id]) {
          acc[response.id] = [];
        }
        
        // Process the response_data object which contains the actual survey responses
        if (response.response_data && typeof response.response_data === 'object') {
          // Extract all question/response pairs from the response_data
          Object.entries(response.response_data).forEach(([questionId, responseValue]) => {
            if (responseValue) { // Only include non-empty responses
              acc[response.id].push(`Question ID: ${questionId}, Response: ${responseValue}`);
            }
          });
        }
        return acc;
      }, {});
      
      // Convert survey responses object to formatted strings - only include those with data
      const surveyResponseStrings = Object.entries(formattedSurveyResponses)
        .filter(([_, responses]) => responses.length > 0) // Skip empty responses
        .map(([responseId, responses]) => 
          `--- Survey Response ID: ${responseId} ---\n${responses.join('\n')}`
        );
      
      // Format final strings with fallbacks
      const messageHistory = conversationMessages.length > 0
        ? conversationMessages.join('\n\n')
        : "No conversations have been recorded yet.";
      
      const surveyResponseData = surveyResponseStrings.length > 0
        ? surveyResponseStrings.join('\n\n')
        : "No survey responses have been recorded yet.";

      // Clean prompt and replace variables
      const defaultInstruction = "Return a JSON structure with the following fields: key_themes, sentiment (overall and summary_text), potential_risks (items and count), potential_opportunities (items and count), dreams_and_aspirations, and fears_and_concerns.";
      
      // Simple JSON example removal - replace with standard instruction
      let cleanedPrompt = promptText;
      const examplePos = promptText.indexOf('Return a JSON structure as follows:');
      if (examplePos !== -1) {
        const jsonStart = promptText.indexOf('{', examplePos);
        if (jsonStart !== -1) {
          cleanedPrompt = promptText.substring(0, jsonStart).replace('Return a JSON structure as follows:', defaultInstruction);
        }
      }
      
      // Replace variables in prompt with simplified regex
      const userPrompt = cleanedPrompt
        .replace(/\$\((conversation|message_history)\)/g, messageHistory)
        .replace(/\$\((survey_responses|survey_respons)\)/g, surveyResponseData);

      // Call OpenAI API
      const response = await generateResponse({
        messages: [{ role: 'user', content: userPrompt }]
      });

      if (!response.text) {
        throw new Error('No response received from OpenAI');
      }

      // Parse the response with fallback
      try {
        // Parse the JSON response
        const parsedData = JSON.parse(response.text);
        
        // Log the parsed data to help debug
        console.log('[SurveySummary] Parsed OpenAI response:', parsedData);
        
        // Check if the parsed data already has the expected structure
        if (parsedData.summary) {
          return parsedData as SurveySummary;
        }
        
        // If not, wrap it in a summary object to match the expected structure
        return {
          summary: {
            key_themes: parsedData.key_themes || [],
            sentiment: {
              overall: parsedData.sentiment?.overall || 'neutral',
              summary_text: parsedData.sentiment?.summary_text || ''
            },
            potential_risks: {
              items: parsedData.potential_risks?.items || [],
              number_of_persons_identifying_risks: parsedData.potential_risks?.count || 0
            },
            potential_opportunities: {
              items: parsedData.potential_opportunities?.items || [],
              number_of_persons_identifying_opportunities: parsedData.potential_opportunities?.count || 0
            },
            dreams_and_aspirations: Array.isArray(parsedData.dreams_and_aspirations) 
              ? parsedData.dreams_and_aspirations 
              : parsedData.dreams_and_aspirations ? [parsedData.dreams_and_aspirations] : [],
            fears_and_concerns: Array.isArray(parsedData.fears_and_concerns)
              ? parsedData.fears_and_concerns
              : parsedData.fears_and_concerns ? [parsedData.fears_and_concerns] : []
          }
        } as SurveySummary;
        
      } catch (parseError) {
        console.error('[SurveySummary] JSON parse error:', parseError);
        
        // Try regex extraction if direct parsing fails
        try {
          const jsonMatch = response.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No valid JSON found in the response');
          
          const extractedData = JSON.parse(jsonMatch[0]);
          
          // Same transformation as above
          if (extractedData.summary) {
            return extractedData as SurveySummary;
          }
          
          return {
            summary: {
              key_themes: extractedData.key_themes || [],
              sentiment: {
                overall: extractedData.sentiment?.overall || 'neutral',
                summary_text: extractedData.sentiment?.summary_text || ''
              },
              potential_risks: {
                items: extractedData.potential_risks?.items || [],
                number_of_persons_identifying_risks: extractedData.potential_risks?.count || 0
              },
              potential_opportunities: {
                items: extractedData.potential_opportunities?.items || [],
                number_of_persons_identifying_opportunities: extractedData.potential_opportunities?.count || 0
              },
              dreams_and_aspirations: Array.isArray(extractedData.dreams_and_aspirations) 
                ? extractedData.dreams_and_aspirations 
                : extractedData.dreams_and_aspirations ? [extractedData.dreams_and_aspirations] : [],
              fears_and_concerns: Array.isArray(extractedData.fears_and_concerns)
                ? extractedData.fears_and_concerns
                : extractedData.fears_and_concerns ? [extractedData.fears_and_concerns] : []
            }
          } as SurveySummary;
        } catch (regexError) {
          console.error('[SurveySummary] Regex extraction failed:', regexError);
          throw new Error('Failed to parse OpenAI response into valid JSON');
        }
      }
    } catch (err) {
      console.error('[SurveySummary] Error generating summary:', err);
      throw err;
    } finally {
      // Use the existing state setter from useState
      setIsGeneratingSummary(false);
    }
    
    return null; // Fallback return in case of errors
  }, [generateResponse]);

  // --------- Empty state data ---------
  // No fallback data - we'll show an empty state instead when no real data exists

  // --------- Main Effect ---------
  
  // Safety function to prevent crashes from undefined variables
  const renderSafe = (renderFn: () => React.ReactNode): React.ReactNode => {
    try {
      return renderFn();
    } catch (err) {
      console.error('[SurveySummary] Render error:', err);
      return <p className="text-red-500">Error rendering component</p>;
    }
  };
  
  useEffect(() => {
    // Prevent duplicate summary generation or running without user
    if (!user || isLoading || summaryGeneratedRef.current) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate permissions and prerequisites
        // Safe to use here as we've already checked user is not null above
        if (user?.role !== 'Clergy') {
          setError('Access Denied: This page is for Clergy members only.');
          return;
        }

        const churchId = user.church_id;
        if (!churchId) {
          setError('No church associated with this account');
          return;
        }

        const hasChurchProfile = await checkChurchProfileExists(churchId);
        if (!hasChurchProfile) {
          // In demo mode, allow page to proceed so we can render using demo data
          if (shouldUseDemoData()) {
            console.warn('[SurveySummary] Church profile missing; proceeding with demo data.');
            setIsUsingDemoData(true);
            // Do not return; the demo fallback below will switch to demo church id
          } else {
            setError('Please complete your church profile before accessing the survey summary.');
            return;
          }
        }

        // First, check if there are any survey responses for the current church
        const currentChurchResponses = await fetchSurveyResponses(churchId);
        
        let actualChurchId = churchId;
        let shouldShowDemoModal = false;
        
        if (currentChurchResponses.length === 0 && shouldUseDemoData()) {
          // No survey responses found for this church - use demo data if demo mode is enabled
          actualChurchId = getDemoChurchId(); // Use centralized demo church ID
          shouldShowDemoModal = shouldShowDemoModals();
          setIsUsingDemoData(true);
          
          // Delay showing the modal to prevent React error #301
          if (shouldShowDemoModal) {
            setTimeout(() => {
              setShowDemoModal(true);
            }, 100);
          }
        } else {
          setIsUsingDemoData(false);
        }

        // Fetch conversation history and survey responses in parallel
        const [conversationData, surveyData] = await Promise.all([
          fetchConversationHistory(actualChurchId),
          fetchSurveyResponses(actualChurchId)
        ]);
        
        setConversations(conversationData);
        setSurveyResponses(surveyData);
        
        if (conversationData.length === 0 && surveyData.length === 0) {
          // Nothing to summarize
          summaryGeneratedRef.current = true;
          return;
        }

        // Generate summary
        try {
          setIsGeneratingSummary(true);
          
          // Get prompt with fallback
          const promptText = await fetchSurveyPrompt().catch(() => 
            "Given all of the conversations: $(message_history) and survey responses $(survey_responses) summarize the messages into the following buckets: major themes, key passages, overall sentiment."
          );
          
          const summary = await generateSurveySummary(conversationData, surveyData, promptText);
          setSummaryData(summary || null);
        } finally {
          setIsGeneratingSummary(false);
          summaryGeneratedRef.current = true;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.church_id, fetchConversationHistory, fetchSurveyPrompt, generateSurveySummary]);
  
  // --------- Render UI ---------
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading survey summary...</p>
      </div>
    );
  }

  if (error) {
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

  if (conversations.length === 0 && !summaryData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No survey data found for your church. Please wait while we load example data...
          </AlertDescription>
        </Alert>
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

      {/* Next Step Button */}
      <div className="mb-8 flex justify-end">
        <Button 
          size="lg" 
          onClick={() => navigate('/community-research')}
          className="text-black font-medium py-2 px-6 rounded-lg transition-colors"
          style={{ backgroundColor: '#fdcd62' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcc332'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdcd62'}
        >
          Next Step: Research Your Neighborhood
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{conversations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Messages per Response</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {conversations.length > 0
                ? (
                    conversations.reduce(
                      (sum, conv) => sum + (conv.conversation_history?.messages?.length || 0),
                      0
                    ) / conversations.length
                  ).toFixed(1)
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
        <Card>
          <CardHeader>
            <CardTitle>Survey Responses Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl">{surveyResponses.length}</p>
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
                <AlertCircle className="h-5 w-5 text-blue-500" /> Key Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(summaryData.summary?.key_themes) ? (
                <ul className="list-disc pl-6 space-y-2">
                  {summaryData.summary?.key_themes?.map((theme, index) => (
                    <li key={index} className="text-lg">{theme}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg">{summaryData.summary?.key_themes || 'No key themes identified'}</p>
              )}
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
            <LocalErrorBoundary>
              <Card>
                <CardHeader>
                  <CardTitle>Potential Risks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">People identifying risks:</span>{" "}
                    {summaryData.summary?.potential_risks?.count || 0}
                  </p>
                  {renderSafe(() => {
                    const items = summaryData.summary?.potential_risks?.items;
                    
                    if (Array.isArray(items)) {
                      return (
                        <ul className="list-disc pl-6 space-y-1">
                          {items.map((item, index) => (
                            <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      );
                    } else if (typeof items === 'object' && items !== null) {
                      // Handle case where items is an object
                      return (
                        <ul className="list-disc pl-6 space-y-1">
                          {Object.keys(items).map((key, index) => (
                            <li key={index}>{key}</li>
                          ))}
                        </ul>
                      );
                    } else if (typeof items === 'string') {
                      return <p>{items}</p>;
                    } else {
                      return <p>No specific risks identified</p>;
                    }
                  })}
                </CardContent>
              </Card>
            </LocalErrorBoundary>
            {/* Opportunities */}
            <LocalErrorBoundary>
              <Card>
                <CardHeader>
                  <CardTitle>Potential Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">People identifying opportunities:</span>{" "}
                    {summaryData.summary?.potential_opportunities?.count || 0}
                  </p>
                  {renderSafe(() => {
                    const items = summaryData.summary?.potential_opportunities?.items;
                    
                    if (Array.isArray(items)) {
                      return (
                        <ul className="list-disc pl-6 space-y-1">
                          {items.map((item, index) => (
                            <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      );
                    } else if (typeof items === 'object' && items !== null) {
                      // Handle case where items is an object
                      return (
                        <ul className="list-disc pl-6 space-y-1">
                          {Object.keys(items).map((key, index) => (
                            <li key={index}>{key}</li>
                          ))}
                        </ul>
                      );
                    } else if (typeof items === 'string') {
                      return <p>{items}</p>;
                    } else {
                      return <p>No specific opportunities identified</p>;
                    }
                  })}
                </CardContent>
              </Card>
            </LocalErrorBoundary>
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
                {summaryData && Array.isArray(summaryData.summary?.dreams_and_aspirations) ? (
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.dreams_and_aspirations?.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{summaryData?.summary?.dreams_and_aspirations || 'No data available'}</p>
                )}
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
                {summaryData && Array.isArray(summaryData.summary?.fears_and_concerns) ? (
                  <ul className="list-disc pl-6 space-y-1">
                    {summaryData.summary?.fears_and_concerns?.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{summaryData?.summary?.fears_and_concerns || 'No data available'}</p>
                )}
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

      {/* Demo Modal */}
      {showDemoModal && (
        <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Demo Data Notice
              </DialogTitle>
              <DialogDescription className="text-left">
                For demo purposes we are showing you sample responses that will be replaced when your survey respondents complete their surveys.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowDemoModal(false)} className="w-full">
                Continue with Demo Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Survey Response Details Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-4xl max-h-[80vh] overflow-y-auto"
            aria-describedby="survey-response-description"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Survey Response Details</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 p-0 absolute right-4 top-4"
                  onClick={handleCloseResponseModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription id="survey-response-description">
                Detailed answers from the selected survey response
              </DialogDescription>
            </DialogHeader>

            {selectedConversation && (
              <>
                {/* Metadata */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold">Response ID:</p>
                    <p className="text-sm">{selectedConversation.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold">Submitted on:</p>
                    <p className="text-sm">
                      {selectedConversation.created_at 
                        ? new Date(selectedConversation.created_at).toLocaleString() 
                        : 'Unknown'}
                    </p>
                  </div>
                  {selectedConversation.user_id && (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold">User ID:</p>
                      <p className="text-sm">{selectedConversation.user_id}</p>
                    </div>
                  )}
                </div>

                {/* Survey Response Data */}
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-6">
                  <h3 className="text-xl font-bold mb-4">Survey Response Data</h3>
                  
                  {selectedSurveyResponse && selectedSurveyResponse.response_data ? (
                    <div className="divide-y divide-gray-200">
                      {Object.entries(selectedSurveyResponse.response_data)
                        .filter(([_, response]) => response !== null && response !== undefined && String(response).trim() !== '')
                        .map(([questionId, response], index) => (
                          <div key={index} className="py-4 first:pt-0 last:pb-0">
                            <div className="text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-md shadow-sm">
                              {typeof response === 'object' 
                                ? JSON.stringify(response, null, 2) 
                                : String(response)}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 text-gray-700 rounded border border-yellow-300">
                      <p className="font-medium">This user only has conversation history available.</p>
                      <p className="text-sm mt-1">No structured survey responses were found for user ID: {selectedConversation.user_id}</p>
                      <p className="text-sm mt-1">You can view their conversation below.</p>
                    </div>
                  )}
                </div>
                
                {/* Technical Debug Info - Hidden by default */}
                <details className="text-xs text-gray-500 border border-gray-200 rounded p-2 mb-6">
                  <summary className="cursor-pointer font-medium">Technical Debug Info</summary>
                  <div className="mt-2 p-2 bg-gray-50">
                    <p>Response data type: {selectedSurveyResponse?.response_data ? typeof selectedSurveyResponse.response_data : 'undefined'}</p>
                    <p>Has response data: {selectedSurveyResponse?.response_data ? 'Yes' : 'No'}</p>
                    {selectedSurveyResponse?.response_data && typeof selectedSurveyResponse.response_data === 'object' && (
                      <p>Keys: {Object.keys(selectedSurveyResponse.response_data).join(', ') || 'none'}</p>
                    )}
                  </div>
                </details>
                
                {/* Original Survey Conversation */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Survey Conversation</h3>
                  <div className="mb-2 text-xs text-gray-500">Showing conversation history between the survey system and respondent</div>
                  {(() => {
                    // Define a messages variable to hold the messages regardless of structure
                    let messages = null;
                    
                    console.log('[SurveySummary] Conversation structure:', JSON.stringify(selectedConversation).substring(0, 200));
                    
                    // Check for messages field in the conversation object
                    if (selectedConversation.messages) {
                      // Handle the case where messages is an array
                      if (Array.isArray(selectedConversation.messages)) {
                        messages = selectedConversation.messages;
                        console.log('[SurveySummary] Using direct messages array, length:', messages.length);
                      } 
                      // Handle the case where messages might be a JSON string
                      else if (typeof selectedConversation.messages === 'string') {
                        try {
                          const parsedMessages = JSON.parse(selectedConversation.messages);
                          if (Array.isArray(parsedMessages)) {
                            messages = parsedMessages;
                            console.log('[SurveySummary] Parsed messages from JSON string, length:', messages.length);
                          }
                        } catch (e) {
                          console.error('[SurveySummary] Failed to parse messages string:', e);
                        }
                      }
                    } 
                    // Check for nested messages in conversation_history
                    else if (selectedConversation.conversation_history && 
                             selectedConversation.conversation_history.messages) {
                      if (Array.isArray(selectedConversation.conversation_history.messages)) {
                        messages = selectedConversation.conversation_history.messages;
                        console.log('[SurveySummary] Using conversation_history.messages array, length:', messages.length);
                      } else if (typeof selectedConversation.conversation_history.messages === 'string') {
                        try {
                          const parsedNestedMessages = JSON.parse(selectedConversation.conversation_history.messages);
                          if (Array.isArray(parsedNestedMessages)) {
                            messages = parsedNestedMessages;
                            console.log('[SurveySummary] Parsed nested messages from JSON string, length:', messages.length);
                          }
                        } catch (e) {
                          console.error('[SurveySummary] Failed to parse nested messages string:', e);
                        }
                      }
                    } 
                    // Last resort - inspect the raw conversation object
                    else {
                      console.log('[SurveySummary] Inspecting raw conversation structure for messages:', 
                        Object.keys(selectedConversation));
                      
                      // Try to parse messages if they might be stored as a string
                      if (typeof selectedConversation.messages === 'string') {
                        try {
                          const parsedMessages = JSON.parse(selectedConversation.messages);
                          if (Array.isArray(parsedMessages)) {
                            messages = parsedMessages;
                            console.log('[SurveySummary] Successfully parsed messages from string');
                          }
                        } catch (e) {
                          console.error('[SurveySummary] Failed to parse messages string:', e);
                        }
                      }
                      
                      // Try one more approach - the messages might be in a nested structure
                      if (!messages) {
                        // Look for a messages array in any property of the conversation object
                        for (const key in selectedConversation) {
                          if (selectedConversation[key] && typeof selectedConversation[key] === 'object') {
                            if (Array.isArray(selectedConversation[key].messages)) {
                              messages = selectedConversation[key].messages;
                              console.log(`[SurveySummary] Found messages in nested property: ${key}`);
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    // If we found messages in any structure, render them
                    if (messages && messages.length > 0) {
                      return (
                        <div className="space-y-3">
                          {messages.map((message, index) => {
                            // Determine sender role - handle different formats
                            const isUser = message.role === 'user' || message.sender === 'user';
                            const senderName = isUser ? 'Respondent' : 'Survey System';
                            
                            // Get content regardless of format
                            const content = message.content || message.text || '';
                            
                            // Get timestamp from various possible formats
                            const timestamp = message.timestamp || message.created_at || '';
                            
                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg ${isUser
                                  ? 'bg-blue-50 border-l-4 border-blue-500'
                                  : 'bg-gray-50 border-l-4 border-gray-300'
                                  }`}
                              >
                                <p className="font-medium mb-2">{senderName}</p>
                                <p className="mt-1 whitespace-pre-wrap">{content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {timestamp ? new Date(timestamp).toLocaleString() : ''}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    // If we couldn't find any messages, show a message
                    return (
                      <div className="p-4 bg-gray-50 text-gray-700 rounded border border-gray-200">
                        <p>No conversation messages found in this survey.</p>
                        <p className="text-sm mt-2">The conversation history structure appears to be:</p>
                        <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-32 rounded">
                          {JSON.stringify(selectedConversation, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>

                <DialogFooter>
                  <Button onClick={handleCloseResponseModal}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
};

export default SurveySummaryPage;
