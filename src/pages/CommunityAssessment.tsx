import { useEffect, useState } from 'react';
import { CommunityAssessmentInterface } from '@/components/CommunityAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

export default function CommunityAssessment() {
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
            Your Neighborhood Assessment
          </h1>

          {/* 3) DESCRIPTION BAR */}
          <div className="mb-8 p-4 bg-gradient-journey-light rounded-2xl">
            <p className="text- text-muted-foreground">
              Evaluate your neighborhood and gather insights that will help shape your church’s ministry approach.
            </p>
          </div>

          {/* 4) EMBEDDED CHAT */}
          <div className="flex-1 overflow-hidden">
            <CommunityAssessmentInterface
              key={sessionKey}
              disableNext  // this prop removes the “Next” button inside the form
            />
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
