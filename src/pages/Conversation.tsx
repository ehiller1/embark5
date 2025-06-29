import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface } from "@/components/ConversationInterface";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AvatarSidebar } from "@/components/narrative-build/AvatarSidebar";
import { useSelectedCompanion, useCompanionSubscriber } from "@/hooks/useSelectedCompanion";
import { AvatarRole } from "@/types/NarrativeTypes";

import { INFORMATION_GATHERER } from '@/constants/avatars';
import { PageAvatarDisplay } from "@/components/avatars/PageAvatarDisplay";

const Conversation = () => {
  const { isAuthenticated, user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    selectedCompanion,
    companionChanged,
    refreshCompanions,
    resetCompanionChanged
  } = useSelectedCompanion();

  useCompanionSubscriber();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shouldRemount, setShouldRemount] = useState(false);

  const [selectedChurchAvatar] = useState(null);
  const [selectedCommunityAvatar] = useState(null);
  const [activeCard, setActiveCard] = useState<AvatarRole | null>(null);

  const handleAvatarCardClick = (type: string) => {
    setActiveCard(type as AvatarRole);
  };

  const locationKey = location.pathname + location.search;
  const sessionKey = session?.access_token?.substring(0, 8) || 'no-session';

  useEffect(() => {
    refreshCompanions();
  }, [refreshCompanions]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }

    if (!INFORMATION_GATHERER) {
      toast({
        title: "Warning",
        description: "Conversation avatar not found. Some features may not work correctly.",
        variant: "destructive"
      });
    }
  }, [isAuthenticated, navigate, locationKey, sessionKey]);

  useEffect(() => {
    if (companionChanged) {
      setShouldRemount(true);
      resetCompanionChanged();
    }
  }, [companionChanged, resetCompanionChanged]);

  if (!isAuthenticated || !user) return null;

  const sectionAvatar = INFORMATION_GATHERER;

  return (
    <>
      <div className="mb-8 px-4 py-6 md:px-6">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/clergy-home')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Home
          </Button>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block xl:inline">Let's start the discernment</span>
          <span className="block text-journey-red xl:inline"> planning process</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          It is important as you start the discernment process to reflect on how you are called to move your parish forward. Articulate your perspective and define how you hear this call and it will guide you through the rest of this process.
        </p>
      </div>

      {/* Sidebar trigger */}
      <Button
        variant="ghost"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-24 left-2 z-50 rounded-full p-2 shadow bg-white"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* Sidebar panel */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30">
          <div className="fixed left-0 top-0 bottom-0 w-[300px] bg-white shadow-xl p-4 overflow-y-auto z-50">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSidebarOpen(false)}
            >
              Close
            </Button>
            <AvatarSidebar
              sectionAvatar={sectionAvatar}
              selectedCompanion={selectedCompanion}
              selectedChurchAvatar={selectedChurchAvatar}
              selectedCommunityAvatar={selectedCommunityAvatar}
              activeCard={activeCard}
              handleAvatarCardClick={handleAvatarCardClick}
            />
          </div>
        </div>
      )}

      <div className="pt-20 h-full flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-3">
        {/* Static left-side sidebar (optional) */}
        <aside className="w-full md:overflow-y-auto hidden md:block">
          <div className="sticky top-20 pink-glass p-1.5 rounded-xl space-y-1.5">
            <PageAvatarDisplay
              sectionAvatar={sectionAvatar}
              selectedCompanion={selectedCompanion}
              showCompanionsList={true}
            />
          </div>
        </aside>

        {/* Main conversation */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <ConversationInterface key={shouldRemount ? Date.now() : 'stable'} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Conversation;
