import { useEffect, useState } from 'react';
import { ChurchAssessmentInterface } from '@/components/church-assessment/ChurchAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

export default function ChurchAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [sessionKey, setSessionKey] = useState<string>('initial');

  useEffect(() => {
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
            Your Community Assessment
          </h1>

          {/* 3) DESCRIPTION BAR */}
          <div className="mb-8 p-4 bg-gradient-journey-light rounded-2xl">
            <p className="text-xl text-muted-foreground">
              Evaluate your faith community or organization's current state and gather insights to guide its future direction.
            </p>
          </div>

          {/* 4) EMBEDDED CHAT */}
          <div className="flex-1 overflow-hidden">
            <ChurchAssessmentInterface
              key={sessionKey}
              disableNext
            />
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
