import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import NarrativeBuild from '@/pages/NarrativeBuild';
import { NarrativeAvatarSelectionModal } from '@/components/narrative-build/NarrativeAvatarSelectionModal';
import { NarrativeConfirmationModal } from '@/components/narrative-build/NarrativeConfirmationModal';

const NarrativeBuildChecker = () => {
  const navigate = useNavigate();
  const { churchAvatar, communityAvatar, fetchChurchAvatars, fetchCommunityAvatars, selectChurchAvatar, selectCommunityAvatar } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();
  
  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [errorState] = useState<string | null>(null);
  const [navigatedToBuilder, setNavigatedToBuilder] = useState(false);
  const [avatarsComplete, setAvatarsComplete] = useState(false);
  
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const startTime = performance.now();
    console.log('[NarrativeBuildChecker] Mounted at path:', currentPath);
    
    // Prefetch avatars on component mount
    fetchChurchAvatars().catch(err => console.error("Error fetching church avatars:", err));
    fetchCommunityAvatars().catch(err => console.error("Error fetching community avatars:", err));
    
    return () => {
      const endTime = performance.now();
      console.log(`[NarrativeBuildChecker] Unmounted. Duration: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [currentPath, fetchChurchAvatars, fetchCommunityAvatars]);

  // Check if all avatars are selected
  useEffect(() => {
    setAvatarsComplete(!!selectedChurchAvatar && !!selectedCommunityAvatar && !!selectedCompanion);
  }, [selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion]);

  // Initialize the flow based on which avatars are already selected
  useEffect(() => {
    console.log('[NarrativeBuildChecker] Checking avatar state for initial modal');
    
    if (avatarsComplete) {
      // All avatars selected, proceed to narrative build
      setInitialCheckDone(true);
    } else {
      // Need to select at least one avatar
      setShowAvatarSelectionModal(true);
      setInitialCheckDone(true);
    }
  }, [avatarsComplete]);

  const handleAvatarSelectionComplete = () => {
    console.log('[NarrativeBuildChecker] Avatar selection completed');
    setShowConfirmationModal(true);
  };

  const handleConfirmationComplete = () => {
    console.log('[NarrativeBuildChecker] Confirmation completed, navigating to narrative build');
    setNavigatedToBuilder(true);
    navigate('/narrative_build');
  };

  // Show error state if there's an error
  if (errorState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Narrative</h2>
          <p className="text-muted-foreground mb-4">{errorState}</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show narrative build if all avatars are selected and we're on the right page
  if ((currentPath === '/narrative_build' || navigatedToBuilder) && initialCheckDone) {
    if (avatarsComplete) {
      return <NarrativeBuild />;
    }
    
    // Show modals and loading state
    return (
      <>
        <NarrativeAvatarSelectionModal
          open={showAvatarSelectionModal}
          onOpenChange={setShowAvatarSelectionModal}
          onComplete={handleAvatarSelectionComplete}
          selectedChurchAvatar={selectedChurchAvatar}
          selectedCommunityAvatar={selectedCommunityAvatar}
          selectChurchAvatar={selectChurchAvatar}
          selectCommunityAvatar={selectCommunityAvatar}
        />
        
        <NarrativeConfirmationModal
          open={showConfirmationModal}
          onOpenChange={setShowConfirmationModal}
          onComplete={handleConfirmationComplete}
        />
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Setting up your narrative...</h2>
            <p className="text-muted-foreground">
              Please complete the avatar selection process to continue.
            </p>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default NarrativeBuildChecker;
