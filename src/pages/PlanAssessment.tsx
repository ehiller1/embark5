import { useEffect, useState } from 'react';
import { PlanAssessmentInterface } from '@/components/plan-assessment/PlanAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function PlanAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [sessionKey, setSessionKey] = useState<string>('initial');
  
  // State for SWOT text inputs
  const [textInputs, setTextInputs] = useState({
    input1: '', // Strengths
    input2: '', // Weaknesses
    input3: '', // Opportunities
    input4: ''  // Threats
  });

  // Handle text input changes
  const handleInputChange = (field: keyof typeof textInputs, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [field]: value
    }));
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
            Strategic Planning Assessment
          </h1>

          {/* 3) DESCRIPTION BAR */}
          <div className="mb-8 p-4 bg-gradient-journey-light rounded-2xl">
            <p className="text-xl text-muted-foreground">
              Conduct a strategic planning interview to gather structured information for your organization's strategic plan.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              Provide your SWOT analysis below and engage with your companion to develop comprehensive strategic insights that will inform your organization's future direction.
            </p>
          </div>

          {/* 4) SWOT TEXT INPUT BOXES */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Strengths</h3>
              <Textarea 
                id="planInput1" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What are your organization's key strengths and advantages?"
                value={textInputs.input1}
                onChange={(e) => handleInputChange('input1', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Weaknesses</h3>
              <Textarea 
                id="planInput2" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What areas need improvement or present challenges?"
                value={textInputs.input2}
                onChange={(e) => handleInputChange('input2', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Opportunities</h3>
              <Textarea 
                id="planInput3" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What external opportunities can your organization pursue?"
                value={textInputs.input3}
                onChange={(e) => handleInputChange('input3', e.target.value)}
              />
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">Threats</h3>
              <Textarea 
                id="planInput4" 
                className="w-full p-2 border rounded-md" 
                rows={3} 
                placeholder="What external threats or challenges does your organization face?"
                value={textInputs.input4}
                onChange={(e) => handleInputChange('input4', e.target.value)}
              />
            </div>
          </div>

          {/* 5) EMBEDDED CHAT */}
          <div className="flex-1 overflow-hidden">
            <PlanAssessmentInterface
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
          
          {/* 6) BUILD PLAN BUTTON */}
          {/* Build a Plan Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ready to Build Your Strategic Plan?</CardTitle>
              <CardDescription>
                Once you've completed your SWOT analysis and strategic interview above, you can generate a comprehensive strategic plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/strategic-plan-builder')}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Build a Plan
                </Button>
                <Button
                  onClick={() => navigate('/discernment-plan')}
                  className="bg-journey-pink hover:bg-journey-pink/90 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Next Step: Discernment Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
