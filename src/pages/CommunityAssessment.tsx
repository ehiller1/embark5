import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
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
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // State for text inputs with localStorage persistence
  const [textInputs, setTextInputs] = useState(() => {
    try {
      const saved = localStorage.getItem('community_assessment_inputs');
      return saved ? JSON.parse(saved) : {
        input1: '',
        input2: '',
        input3: '',
        input4: ''
      };
    } catch {
      return {
        input1: '',
        input2: '',
        input3: '',
        input4: ''
      };
    }
  });
  
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [showReminderMessage, setShowReminderMessage] = useState<boolean>(false);
  
  // Handle text input changes
  const handleInputChange = (field: keyof TextInputs, value: string) => {
    const updatedInputs = {
      ...textInputs,
      [field]: value
    };
    setTextInputs(updatedInputs);
    localStorage.setItem('community_assessment_inputs', JSON.stringify(updatedInputs));
  };

  useLayoutEffect(() => {
    // Simply scroll to top on page load without disabling scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // After mount, blur any auto-focused element that could force-scroll the page
  useEffect(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      try { el.blur(); } catch {}
      // Ensure we remain at the top after blurring
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    // Anchor focus to the title at the very top
    if (titleRef.current) {
      // Make it programmatically focusable without tab stop
      titleRef.current.setAttribute('tabindex', '-1');
      try { titleRef.current.focus({ preventScroll: true } as any); } catch {}
    }
  }, []);

  // Defer rendering of the chat a bit to prevent scroll anchoring towards the bottom input
  useEffect(() => {
    const t = setTimeout(() => setShowChat(true), 200);
    return () => clearTimeout(t);
  }, []);

  // These functions are kept for compatibility but not currently used
  // since the new hook handles messaging internally
  const handleUserMessage = useCallback(() => {
    // No-op for now
  }, []);

  const handleReminderShown = useCallback(() => {
    // No-op for now
  }, []);

  return (
    <AssessmentSidebar>
      <div className="flex flex-col lg:flex-row">

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col px-6 lg:px-8 py-6">
          {/* Back button removed */}

          {/* 2) TITLE */}
          <h1 ref={titleRef} className="text-4xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
            Community Assessment
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
          <div className="flex-1" style={{ overflowAnchor: 'none' as any }}>
            {showChat && (
              <CommunityAssessmentInterface
                disableNext
                textInputs={{
                  input1: textInputs.input1,
                  input2: textInputs.input2,
                  input3: textInputs.input3,
                  input4: textInputs.input4
                }}
              />
            )}
          </div>
          
          {/* Next Steps Buttons */}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => navigate('/neighborhood-survey')}
              className="text-black font-medium py-2 px-6 rounded-lg flex items-center transition-colors"
              style={{ backgroundColor: '#fdcd62' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcc332'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdcd62'}
            >
              Next Step: Survey the Neighborhood <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
