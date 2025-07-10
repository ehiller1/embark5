import React, { useEffect, useState } from 'react';
import { CompanionSelectionModal } from './CompanionSelectionModal';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';

interface AuthCompanionFlowProps {
  onFlowComplete?: () => void;
}

export const AuthCompanionFlow: React.FC<AuthCompanionFlowProps> = ({ 
  onFlowComplete 
}) => {
  const { isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  // Use both hooks during transition period
  const { selectedCompanion: narrativeCompanion } = useNarrativeAvatar();
  const { selectedCompanion: standardCompanion, hasSelectedCompanion } = useSelectedCompanion();
  const [showCompanionModal, setShowCompanionModal] = useState(false);

  // Check if the user is authenticated, has a profile, and is a Clergy
  useEffect(() => {
    if (isAuthenticated && !profileLoading && profile) {
      const isClergy = profile.role === 'Clergy';
      
      // Check if a companion is selected using the standardized hook
      const hasCompanion = hasSelectedCompanion();
      
      console.log('[AuthCompanionFlow] Auth state:', { 
        isClergy, 
        hasCompanion, 
        standardCompanion: !!standardCompanion,
        narrativeCompanion: !!narrativeCompanion
      });
      
      // Show companion modal if user is clergy and doesn't have a companion selected
      if (isClergy && !hasCompanion) {
        setShowCompanionModal(true);
      }
    }
  }, [isAuthenticated, profileLoading, profile, standardCompanion, narrativeCompanion, hasSelectedCompanion]);

  const handleCompanionSelectionComplete = () => {
    // Close the modal
    setShowCompanionModal(false);
    
    // Notify parent component that the flow is complete
    if (onFlowComplete) {
      onFlowComplete();
    }
  };

  return (
    <CompanionSelectionModal
      open={showCompanionModal}
      onOpenChange={setShowCompanionModal}
      onSelectionComplete={handleCompanionSelectionComplete}
    />
  );
};
