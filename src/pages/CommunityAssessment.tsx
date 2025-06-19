import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CommunityAssessmentInterface } from '@/components/CommunityAssessmentInterface';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { AvatarCards } from '@/components/AvatarCards';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CommunityAssessment() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [sessionKey, setSessionKey] = useState<string>('initial');
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  
  // Always get conversation avatar as fallback if specific one isn't available
  const communityAssessmentAvatar = getAvatarForPage('community_assessment');
  const conversationAvatar = getAvatarForPage('conversation');
  const displayAvatar = communityAssessmentAvatar || conversationAvatar;
  
  useEffect(() => {
    // Generate a unique key based on the current session
    // This forces a re-render of child components when the session changes
    setSessionKey(session?.access_token?.substring(0, 8) || 'no-session');
  }, [session]);
  
  const handleNext = () => {
    navigate('/community_research');
  };
  
  const content = (
    <MainLayout>
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/conversation">Conversation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Community Assessment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="mb-4 pt-2 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <aside className="w-full md:overflow-y-auto">
          <div className="sticky top-20 pink-glass p-1.5 rounded-xl space-y-1.5">
            <AvatarCards 
              sectionAvatar={displayAvatar}
              selectedCompanion={selectedCompanion}
              selectedChurchAvatar={null}
              selectedCommunityAvatar={null}
            />
          </div>
        </aside>
        
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-semibold mb-4 bg-clip-text text-transparent bg-gradient-journey">Your Community Point of View</h1>
          
          <div className="p-1 bg-gradient-journey-light rounded-xl mb-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Evaluate your community and gather insights that will help shape your church's ministry approach.
              </p>
            </div>
          </div>
          
          <div className="flex-grow h-[calc(100vh-300px)] overflow-hidden">
            <CommunityAssessmentInterface key={sessionKey} onNext={handleNext} />
          </div>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <AssessmentSidebar>
      {content}
    </AssessmentSidebar>
  );
}
