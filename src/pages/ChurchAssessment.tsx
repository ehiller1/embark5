import { useEffect, useState } from 'react';
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
  const [sessionKey, setSessionKey] = useState<string>('initial');
  
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

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    setSessionKey(session?.access_token?.substring(0, 8) || 'no-session');
  }, [session]);

  return (
    <AssessmentSidebar>
      <div className="flex flex-col lg:flex-row">

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col px-6 lg:px-8 py-6">
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
          <h1 className="text-4xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
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
          <div className="flex-1 overflow-hidden">
            <ChurchAssessmentInterface
              key={sessionKey}
              disableNext
              textInputs={{
                input1: textInputs.input1,
                input2: textInputs.input2,
                input3: textInputs.input3,
                input4: textInputs.input4
              }}
            />
          </div>
          
          {/* 6) NEXT STEPS BUTTON */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => navigate('/discernment-plan')}
              className="bg-journey-pink hover:bg-journey-pink/90 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Next Step: Discernment Plan
            </Button>
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
