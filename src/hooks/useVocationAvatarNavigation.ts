import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';

export function useVocationAvatarNavigation(open: boolean, _onOpenChange: (open: boolean) => void, shouldValidate: boolean = false) {
  const navigate = useNavigate();
  const { churchAvatar, communityAvatar } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();

  useEffect(() => {
    if (!open && shouldValidate) {
      const avatarsCompleted = churchAvatar && communityAvatar && selectedCompanion;

      if (avatarsCompleted) {
        setTimeout(() => {
          navigate('/narrative_build');
        }, 100);
      }
    }
  }, [open, shouldValidate, churchAvatar, communityAvatar, selectedCompanion, navigate]);
}
