import { useEffect, useState } from 'react';
import { CommunityAssessmentInterface } from '@/components/CommunityAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

export default function CommunityAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [sessionKey, setSessionKey] = useState<string>('initial');
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [showReminderMessage, setShowReminderMessage] = useState<boolean>(false);

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
              Evaluate your neighborhood and gather insights that will help shape your community’s ministry approach.
            </p>
            <p className="mt-4 text-lg text-gray-600">
            Enter into conversation and provide your thoughts and point of view about your neighborhood-Its needs, aspiration and community engagement.  Your views will help shape the subsequent discernment journey and options available to you.
            </p>
          </div>

          {/* 4) EMBEDDED CHAT */}
          <div className="flex-1 overflow-hidden">
            <CommunityAssessmentInterface
              key={sessionKey}
              disableNext  // this prop removes the “Next” button inside the form
              onUserMessageSent={() => {
                 setUserMessageCount(prevCount => {
                   const updated = prevCount + 1;
                   if (updated % 10 === 0) {
                     setShowReminderMessage(true);
                   }
                   return updated;
                 });
               }}
              showReminderMessage={showReminderMessage}
              onReminderMessageShown={() => {
                 // hide the reminder and reset the counter for the next cycle
                 setShowReminderMessage(false);
                 setUserMessageCount(0);
               }}
              reminderMessage="You have provided a lot of information. Do you want to continue or I can integrate everything you said and you can just click the Next Step button and we can move on"
            />
          </div>
          
          {/* Next Steps Button */}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => navigate('/neighborhood-survey')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
            >
              Next Steps: Create A Summary Report <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </AssessmentSidebar>
  );
}
