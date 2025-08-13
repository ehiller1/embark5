import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { AuthModal } from "@/components/AuthModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useViabilityMessages } from "@/hooks/useViabilityMessages";
import { useOpenAI } from "@/hooks/useOpenAI";
import { supabase } from "@/integrations/lib/supabase";

// Helper function to format message content with proper line breaks and paragraphs
const formatMessageContent = (content: string) => {
  if (!content) return '';
  
  // Split content into paragraphs based on double line breaks
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, i) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return null;
    
    // Check if the paragraph is a list item
    if (paragraph.trim().startsWith('- ') || paragraph.trim().match(/^\d+\./)) {
      // Split list items by line breaks and create list elements
      const listItems = paragraph.split('\n').filter(item => item.trim());
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="mb-1 last:mb-0">
              {item.replace(/^- /, '').replace(/^\d+\.\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    
    // Regular paragraph with proper line breaks
    return (
      <p key={i} className="mb-3 last:mb-0">
        {paragraph.split('\n').map((line, lineIndex, lines) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
};

// Interface for viability score response
interface ViabilityScore {
  score: number;
  interpretation: string;
}

const Analysis = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Define the type for text inputs
  interface TextInputs {
    input1: string;
    input2: string;
    input3: string;
    input4: string;
  }
  
  // Default empty values
  const defaultInputs: TextInputs = {
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  };
  
  // State for text inputs
  const [textInputs, setTextInputs] = useState<TextInputs>(() => {
    // Try to get saved fields from localStorage
    const savedFields = localStorage.getItem('viability_fields');
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields) as TextInputs;
        // Validate the structure of parsed data
        if (typeof parsed === 'object' && parsed !== null && 
            'input1' in parsed && 'input2' in parsed && 
            'input3' in parsed && 'input4' in parsed) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing saved viability fields:', e);
      }
    }
    // Return default values if parsing fails or structure is invalid
    return defaultInputs;
  });
  
  // State for viability score - initialize from localStorage if available
  const [viabilityScore, setViabilityScore] = useState<ViabilityScore | null>(() => {
    const savedScore = localStorage.getItem('viability_score');
    if (savedScore) {
      try {
        return JSON.parse(savedScore) as ViabilityScore;
      } catch (e) {
        console.error('Error parsing saved viability score:', e);
        return null;
      }
    }
    return null;
  });
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const { generateResponse } = useOpenAI();
  // Prevent overlapping score calculations
  const calcInFlightRef = useRef(false);

  // Track which stage score has been calculated: 'none' | 'stage1' | 'stage2'
  const [scoreStage, setScoreStage] = useState<'none' | 'stage1' | 'stage2'>('none');

  // Debounce timer reference for delayed calculation
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle text input changes – no direct score calculation here, we'll use useEffect to react
  const handleInputChange = (field: keyof typeof textInputs, value: string) => {
    const updatedInputs = {
      ...textInputs,
      [field]: value
    };
    
    setTextInputs(updatedInputs);
    
    // Save to localStorage
    localStorage.setItem('viability_fields', JSON.stringify(updatedInputs));
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // No immediate calculation here – handled by watcher useEffect
  };
  
  // Get viability_score prompt from database
  const getViabilityScorePrompt = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'viability_score')
        .single();
        
      if (error) {
        console.error('Error fetching viability_score prompt:', error);
        return null;
      }
      
      return data?.prompt || null;
    } catch (error) {
      console.error('Error in getViabilityScorePrompt:', error);
      return null;
    }
  };
  
  // ---------------------------------------------
   // CALCULATION HELPERS
   // ---------------------------------------------

   // Determine if stage1 conditions met: first two inputs filled
   const isStage1Ready = (inputs: typeof textInputs) =>
     inputs.input1.trim() !== '' && inputs.input2.trim() !== '';

   // Determine if stage2 conditions met: all four inputs filled and at least one user message sent
   const isStage2Ready = (inputs: typeof textInputs, msgs: typeof messages) => {
     const allInputs = Object.values(inputs).every(val => val.trim() !== '');
     const hasFirstUserMsg = msgs.some(m => m.sender === 'user');
     return allInputs && hasFirstUserMsg;
   };

   // Calculate viability score based on inputs
  const calculateViabilityScore = async (inputs: typeof textInputs) => {
    // Skip if no inputs provided
    const hasInputs = Object.values(inputs).some(input => input.trim() !== '');
    if (!hasInputs) {
      setViabilityScore(null);
      return;
    }

    // Guard against overlapping requests
    if (calcInFlightRef.current) {
      return;
    }
    calcInFlightRef.current = true;
    setIsCalculatingScore(true);
    
    try {
      // Get the prompt template
      const promptTemplate = await getViabilityScorePrompt();
      if (!promptTemplate) {
        throw new Error('Failed to get viability score prompt');
      }
      
      // Combine all text inputs with field titles as questions
      const textFieldContent = Object.entries(inputs)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => {
          const fieldQuestions = {
            input1: 'What are your current challenges?',
            input2: 'How ready is your leadership team?',
            input3: 'What is your community context?',
            input4: 'What are your previous experiences?'
          }[key];
          const fieldName = {
            input1: 'Current Challenges',
            input2: 'Leadership Readiness',
            input3: 'Community Context',
            input4: 'Previous Experiences'
          }[key];
          return `${fieldQuestions}\n${fieldName}: ${value}`;
        })
        .join('\n\n');
      
      // Replace placeholder in prompt
      const populatedPrompt = promptTemplate.replace('$[text_field_content]', textFieldContent);
      
      // Call OpenAI - use the populated prompt directly as a user message, not as system content
      // Explicitly set systemPrompt to empty string to prevent default system prompt
      const response = await generateResponse({
        messages: [
          { role: 'user', content: populatedPrompt }
        ],
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: '' // Explicitly set to empty string to override default
      });
      
      if (!response.text) {
        throw new Error(response.error || 'Failed to generate score');
      }
      
      // Parse the JSON response
      try {
        // Extract JSON object from the response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonStr = jsonMatch[0];
        const result = JSON.parse(jsonStr);
        console.log('Parsed JSON result:', result);
        
        // Handle different response formats
        if (result.viability && Array.isArray(result.viability) && result.viability.length > 0) {
          // New format with viability array
          const viabilityItem = result.viability[0];
          const scoreData = {
            score: viabilityItem.score || 0,
            interpretation: viabilityItem.interpretation || 'No interpretation available.'
          };
          setViabilityScore(scoreData);
          // Save to localStorage
          localStorage.setItem('viability_score', JSON.stringify(scoreData));
          console.log('Using viability array format:', viabilityItem);
        } else if (result.score !== undefined) {
          // Original format with direct score and interpretation
          const scoreData = {
            score: result.score || 0,
            interpretation: result.interpretation || 'No interpretation available.'
          };
          setViabilityScore(scoreData);
          // Save to localStorage
          localStorage.setItem('viability_score', JSON.stringify(scoreData));
          console.log('Using direct score/interpretation format');
        } else {
          throw new Error('Unexpected JSON structure in response');
        }
      } catch (parseError) {
        console.error('Error parsing viability score response:', parseError);
        console.log('Response text:', response.text);
        
        // Fallback: try to extract score and interpretation directly
        const scoreMatch = response.text.match(/score:\s*(\d+)/i);
        const interpretationMatch = response.text.match(/interpretation:\s*([^\n]+)/i);
        
        if (scoreMatch && interpretationMatch) {
          const scoreData = {
            score: parseInt(scoreMatch[1], 10),
            interpretation: interpretationMatch[1].trim()
          };
          setViabilityScore(scoreData);
          // Save to localStorage
          localStorage.setItem('viability_score', JSON.stringify(scoreData));
          console.log('Using regex fallback parsing');
        } else {
          throw new Error('Failed to parse viability score response');
        }
      }
    } catch (error) {
      console.error('Error calculating viability score:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate viability score. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCalculatingScore(false);
      calcInFlightRef.current = false;
    }
  };

  const {
    messages = [],
    isLoading,
    sendMessage,
    generateInitialMessage
  } = useViabilityMessages();

  // Allow access without authentication
  // The viability page should be accessible to users who are uncertain about starting

  // Generate initial message once on mount (hook guards against duplicates)
  useEffect(() => {
    generateInitialMessage(textInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to scroll to the bottom of the conversation
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // ---------------------------------------------
   // WATCHERS TO TRIGGER SCORE CALCULATION
   // ---------------------------------------------

   // Watch for changes in inputs or messages to trigger calculation per stage logic
   useEffect(() => {
     const triggerCalculation = (stage: 'stage1' | 'stage2') => {
       if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
       debounceTimerRef.current = setTimeout(() => {
         calculateViabilityScore(textInputs);
         setScoreStage(stage);
       }, 800); // slight debounce
     };

     if (scoreStage === 'none' && isStage1Ready(textInputs)) {
       triggerCalculation('stage1');
     } else if (scoreStage === 'stage1' && isStage2Ready(textInputs, messages)) {
       triggerCalculation('stage2');
     }
    }, [textInputs, messages, scoreStage]);

    // Clear any pending debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

   // Track if this is the first render with messages
  const isFirstRender = useRef(true);
  
  // Scroll to bottom only when messages change and not on initial load
  useEffect(() => {
    // Skip scrolling on first render with messages
    if (isFirstRender.current && messages.length > 0) {
      isFirstRender.current = false;
      return;
    }
    
    // Only scroll to bottom if there are messages and it's not the initial render
    if (messages.length > 0 && !isFirstRender.current) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);
  
  // Also scroll to bottom when loading state changes, but not on initial load
  useEffect(() => {
    if (!isLoading && !isFirstRender.current) {
      // When loading completes (new message received), scroll to bottom
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scrollToBottom]);

  // Text inputs are automatically applied when changed via the useEffect dependency

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(
        newMessage.trim(),
        {
          input1: textInputs.input1,
          input2: textInputs.input2,
          input3: textInputs.input3,
          input4: textInputs.input4
        },
        viabilityScore?.score
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Ensure the page starts at the top when loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Back button above the header */}
      <div className="bg-white px-4 sm:px-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20 z-20"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </div>
      
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">Viability Assessment</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Is now the right time?</h1>
          <p className="text-muted-foreground">
            Faith communities and organizations often wrestle with the question of when to begin a discernment process—especially in seasons of transition, 
            declining membership, or shifting community dynamics. We've aggregated deep wisdom and real-world insight to help you 
            consider whether this is the right time for your faith community to take its next step.</p>
          <p>Please provide additional information through our interactive chat function. As you provide details, a score will be calculated out of a possible 100 points. A higher score indicates your community's readiness for formal discernment.</p>
        </div>
        
        {/* TEXT INPUT BOXES */}
        {/* Viability Score Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Viability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-lg mb-2">Score</h3>
                <div className="flex items-center justify-center h-16">
                  {isCalculatingScore ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : viabilityScore ? (
                    <span className="text-3xl font-bold text-primary">{viabilityScore.score}</span>
                  ) : (
                    <span></span>
                  )}
                </div>
              </div>
              <div className="col-span-3 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-lg mb-2">Interpretation</h3>
                <div className="h-auto max-h-36 overflow-y-auto">
                  {isCalculatingScore ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : viabilityScore?.interpretation ? (
                    <p className="text-sm">{viabilityScore.interpretation}</p>
                  ) : (
                    <p></p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Current Challenges</h3>
            <Textarea 
              id="viabilityInput1" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe the current challenges your faith community is facing."
              value={textInputs.input1}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input1', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Leadership Readiness</h3>
            <Textarea 
              id="viabilityInput2" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Assess your leadership team's readiness for a discernment process..."
              value={textInputs.input2}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input2', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Community Context</h3>
            <Textarea 
              id="viabilityInput3" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Share information about your community context and recent changes."
              value={textInputs.input3}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input3', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Previous Experiences</h3>
            <Textarea 
              id="viabilityInput4" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe any previous discernment or strategic planning processes."
              value={textInputs.input4}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input4', e.target.value)}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
          <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[90%] sm:max-w-[80%] break-words whitespace-pre-wrap ${msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'}`}
                  >
                    {formatMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%] flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type here what you want to say"
                  className="flex-1 min-w-0"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  size="icon"
                  className="flex-shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
              <Button 
                onClick={() => isAuthenticated ? navigate('/clergy-home') : setAuthModalOpen(true)} 
                variant="secondary" 
                className="whitespace-nowrap text-white"
              >
                <span className="hidden sm:inline text-white">Ready to start planning?</span>
                <ArrowRight className="ml-1 h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLoginSuccess={() => {
          navigate('/clergy-home');
        }}
      />
    </div>
  );
};

export default Analysis;