import { useEffect, useState, useRef, useCallback } from 'react';
import { CommunityAssessmentInterface } from '@/components/CommunityAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { Textarea } from '@/components/ui/textarea';

interface TextInputs {
  input1: string;
  input2: string;
  input3: string;
  input4: string;
}

export default function CommunityAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [sessionKey, setSessionKey] = useState<string>('initial');
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [showReminderMessage, setShowReminderMessage] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [textInputs, setTextInputs] = useState<TextInputs>({
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Handle text input changes
  const handleInputChange = (field: keyof TextInputs, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    setSessionKey(session?.access_token?.substring(0, 8) || 'no-session');
  }, [session]);

  // Reset message counter when component unmounts
  useEffect(() => {
    return () => {
      setUserMessageCount(0);
      setShowReminderMessage(false);
    };
  }, []);

  // Track user scroll
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // Track user messages and show reminder
  const handleUserMessage = useCallback(() => {
    setUserMessageCount(prevCount => {
      const updated = prevCount + 1;
      console.log(`[CommunityAssessment] Message count: ${updated}`);
      if (updated >= 3) { // Changed from 10 to 3 for testing, change back to 10 for production
        console.log('[CommunityAssessment] Showing reminder message');
        setShowReminderMessage(true);
      }
      return updated;
    });
  }, []);

  // Handle reminder message shown
  const handleReminderShown = useCallback(() => {
    console.log('[CommunityAssessment] Reminder message shown, resetting counter');
    setShowReminderMessage(false);
    setUserMessageCount(0);
  }, []);

  return (
    <AssessmentSidebar>
      <div className="flex flex-col lg:flex-row">

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col px-6 lg:px-8 py-6">
          {/* Back button removed */}

          {/* 2) TITLE */}
          <h1 className="text-4xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
            Your Neighborhood Assessment
          </h1>

          {/* 3) DESCRIPTION BAR */}
          <div className="mb-8 p-4 bg-gradient-journey-light rounded-2xl">
            <p className="text- text-muted-foreground">
              Continue to gather insights that will help shape your community’s ministry approach.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              Provide your thoughts and point of view about your neighborhood--its needs, aspiration and community engagement.   Your views will help shape the subsequent discernment journey and options available to you.
            </p>
          </div>

          {/* 4) TEXT INPUT BOXES */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Demographics</h3>
              <Textarea 
                id="communityInput1" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="Describe the demographic makeup of your community."
                value={textInputs.input1}
                onChange={(e) => handleInputChange('input1', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Needs</h3>
              <Textarea 
                id="communityInput2" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What are the key needs in your community?"
                value={textInputs.input2}
                onChange={(e) => handleInputChange('input2', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Assets</h3>
              <Textarea 
                id="communityInput3" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What are the key assets in your community?"
                value={textInputs.input3}
                onChange={(e) => handleInputChange('input3', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Opportunities</h3>
              <Textarea 
                id="communityInput4" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What opportunities do you see for community engagement?"
                value={textInputs.input4}
                onChange={(e) => handleInputChange('input4', e.target.value)}
              />
            </div>
          </div>

          {/* 5) EMBEDDED CHAT */}
          <div className="flex-1 overflow-hidden" ref={scrollAreaRef} onScroll={handleScroll}>
            <div className="flex-1 overflow-auto">
              <CommunityAssessmentInterface
                key={sessionKey}
                disableNext  // this prop removes the “Next” button inside the form
                onUserMessageSent={handleUserMessage}
                showReminderMessage={showReminderMessage}
                onReminderMessageShown={handleReminderShown}
                textInputs={textInputs}
                reminderMessage="You have provided a lot of information. Do you want to continue or I can integrate everything you said and you can just click the Next Step button and we can move on"
              />
            </div>
          </div>
          
          {/* Next Steps Buttons */}
          <div className="mt-6 flex justify-between">
            <Button 
              onClick={() => navigate('/neighborhood-survey')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg flex items-center transition-colors"
            >
              Next Steps: Survey the Neighborhood <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={() => navigate('/research-summary')}
              className="bg-journey-pink hover:bg-journey-pink/90 text-white font-medium py-2 px-6 rounded-lg flex items-center transition-colors"
            >
              Next Step: Research Summary <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
