import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import NarrativeBuild from '@/pages/NarrativeBuild';
import { NarrativeAvatarSelectionModal } from '@/components/narrative-build/NarrativeAvatarSelectionModal';
import { NarrativeConfirmationModal } from '@/components/narrative-build/NarrativeConfirmationModal';

const NarrativeBuildChecker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const { churchAvatar, communityAvatar, selectChurchAvatar, selectCommunityAvatar } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();
  
  const [showAvatarSelectionModal, setShowAvatarSelectionModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [navigatedToBuilder, setNavigatedToBuilder] = useState(false);
  const [avatarsComplete, setAvatarsComplete] = useState(false);
  
  const handleAvatarSelect = () => {
    setShowConfirmationModal(true);
  };

  useEffect(() => {
    const startTime = performance.now();
    console.log('[NarrativeBuildChecker] Mounted at path:', currentPath);
    
    return () => {
      const endTime = performance.now();
      console.log(`[NarrativeBuildChecker] Unmounted. Duration: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [currentPath]);

  // Check if all avatars are selected
  useEffect(() => {
    const selectedAvatarCount = [churchAvatar, communityAvatar, selectedCompanion].filter(Boolean).length;
    setAvatarsComplete(selectedAvatarCount === 3);
  }, [churchAvatar, communityAvatar, selectedCompanion]);

  // Check if we need to show the avatar selection modal on initial render
  useEffect(() => {
    if (!initialCheckDone) {
      if (!churchAvatar || !communityAvatar) {
        setShowAvatarSelectionModal(true);
      }
      setInitialCheckDone(true);
    }
  }, [initialCheckDone, churchAvatar, communityAvatar]);

  const handleConfirmationComplete = () => {
    console.log('[NarrativeBuildChecker] Confirmation completed, navigating to narrative build');
    navigate('/narrative-builder');
    setNavigatedToBuilder(true);
  };

  // Show narrative build if all avatars are selected and we're on the right page
  if ((currentPath === '/narrative-builder' || navigatedToBuilder) && initialCheckDone) {
    if (avatarsComplete) {
      return <NarrativeBuild />;
    }
    
    return (
      <>
        <NarrativeAvatarSelectionModal
          open={showAvatarSelectionModal}
          onOpenChange={setShowAvatarSelectionModal}
          onComplete={handleAvatarSelect}
          selectedChurchAvatar={churchAvatar}
          selectedCommunityAvatar={communityAvatar}
          selectChurchAvatar={selectChurchAvatar}
          selectCommunityAvatar={selectCommunityAvatar}
        />
        <NarrativeConfirmationModal
          open={showConfirmationModal}
          onOpenChange={setShowConfirmationModal}
          onComplete={handleConfirmationComplete}
        />
      </>
    );
  }

  return null;
};

export default NarrativeBuildChecker;
