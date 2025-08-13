import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChurchAssessmentInterface } from '@/components/church-assessment/ChurchAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { Textarea } from '@/components/ui/textarea';

export default function ChurchAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // State for text inputs with localStorage persistence
  const [textInputs, setTextInputs] = useState(() => {
    try {
      const saved = localStorage.getItem('church_assessment_inputs');
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

  // Handle text input changes
  const handleInputChange = (field: keyof typeof textInputs, value: string) => {
    const updatedInputs = {
      ...textInputs,
      [field]: value
    };
    setTextInputs(updatedInputs);
    localStorage.setItem('church_assessment_inputs', JSON.stringify(updatedInputs));
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

  // No key-based remounting; pass session info as regular props if needed

  // Defer rendering of the chat a bit to prevent scroll anchoring towards the bottom input
  useEffect(() => {
    const t = setTimeout(() => setShowChat(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AssessmentSidebar>
      <div className="flex flex-col lg:flex-row" style={{ overflowAnchor: 'none' as any }}>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col px-6 lg:px-8 py-6" style={{ overflowAnchor: 'none' as any }}>
          {/* 1) SINGLE BACK BUTTON */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clergy-home')}
              className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          {/* 2) TITLE */}
          <h1 ref={titleRef} className="text-4xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
            Leadership Insights
          </h1>

          {/* 3) DESCRIPTION BAR */}
          <div className="mb-8 p-4 bg-gradient-journey-light rounded-2xl">
            <p className="text-xl text-muted-foreground">
            As a community leader, provide additional insights about the current state of your organization and its discernment.  Utilize your Conversation Companion to provide additional insights about your community.
            </p>
            <p className="mt-4 text-lg text-gray-600">
            Your insights will be used to further explore potential mission statements, transformation opportunities for new ministries and facility use planning.
            </p>

          </div>

          {/* 4) TEXT INPUT BOXES */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Celebrations</h3>
              <Textarea 
                id="churchInput1" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="Describe ministries or historical contexts that your organization celebrates."
                value={textInputs.input1}
                onChange={(e) => handleInputChange('input1', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Opportunities</h3>
              <Textarea 
                id="churchInput2" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="As a leader, what opportunities have you identified for your organization."
                value={textInputs.input2}
                onChange={(e) => handleInputChange('input2', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Obstacles</h3>
              <Textarea 
                id="churchInput3" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="As a leader, what do you believe stands in the way of your current mission."
                value={textInputs.input3}
                onChange={(e) => handleInputChange('input3', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Engagement</h3>
              <Textarea 
                id="churchInput4" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="How does your organization's membership engage in shared mission?"
                value={textInputs.input4}
                onChange={(e) => handleInputChange('input4', e.target.value)}
              />
            </div>
          </div>

          {/* 5) EMBEDDED CHAT */}
          <div className="flex-1" style={{ overflowAnchor: 'none' as any }}>
            {showChat && (
              <ChurchAssessmentInterface
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
          
          {/* 6) NEXT STEPS BUTTON */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => navigate('/research-summary')}
              className="text-black font-medium py-2 px-6 rounded-lg transition-colors"
              style={{ backgroundColor: '#fdcd62' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcc332'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdcd62'}
            >
              Next Step: Summarize the Findings
            </Button>
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
