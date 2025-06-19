import { useState, useCallback, useEffect } from 'react';
import { useNarrativeAvatar, ChurchAvatar, CommunityAvatar } from './useNarrativeAvatar';
import { useSelectedCompanion } from './useSelectedCompanion';

export type AvatarType = 'church' | 'community' | 'companion';

interface UseActiveAvatarsProps {
  onGenerateMessages: (responses: { type: AvatarType; content: string }[]) => void;
}

export interface AvatarData {
  church?: ChurchAvatar | null;
  community?: CommunityAvatar | null;
  companion?: any | null;
}

export function useActiveAvatars({ onGenerateMessages }: UseActiveAvatarsProps) {
  const { selectedCompanion } = useSelectedCompanion();
  const { 
    selectedChurchAvatar,
    selectedCommunityAvatar,
  } = useNarrativeAvatar();
  
  const [activeAvatars, setActiveAvatars] = useState<AvatarType[]>([]);

  // Initialize and sync activeAvatars based on selected avatars
  useEffect(() => {
    const newActiveAvatars: AvatarType[] = [];
    
    if (selectedChurchAvatar) {
      newActiveAvatars.push('church');
    }
    
    if (selectedCommunityAvatar) {
      newActiveAvatars.push('community');
    }
    
    if (selectedCompanion) {
      newActiveAvatars.push('companion');
    }

    setActiveAvatars(newActiveAvatars);
    
    // Update localStorage to persist active avatar state
    localStorage.setItem('active_avatars', JSON.stringify(newActiveAvatars));
  }, [selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion]);
  
  // Create avatarData object with all selected avatars
  const avatarData: AvatarData = {
    church: selectedChurchAvatar,
    community: selectedCommunityAvatar,
    companion: selectedCompanion
  };

  const isAvatarActive = useCallback((type: AvatarType): boolean => {
    return activeAvatars.includes(type);
  }, [activeAvatars]);

  const toggleAvatar = useCallback((type: AvatarType): void => {
    setActiveAvatars(prev => {
      const isCurrentlyActive = prev.includes(type);
      return isCurrentlyActive 
        ? prev.filter(avatar => avatar !== type)
        : [...prev, type];
    });
  }, []);

  const validateAvatarsForScenarios = useCallback((): boolean => {
    // Only require church and community avatars, companion is optional
    const requiredAvatars: AvatarType[] = ['church', 'community'];
    const missing = requiredAvatars.filter(type => !isAvatarActive(type));
    return missing.length === 0;
  }, [isAvatarActive]);

  const generateMessagesForActiveAvatars = useCallback(() => {
    if (!validateAvatarsForScenarios()) {
      return false;
    }
    onGenerateMessages([]);
    return true;
  }, [onGenerateMessages, validateAvatarsForScenarios]);

  return {
    activeAvatars,
    toggleAvatar,
    isAvatarActive,
    avatarData,
    generateMessagesForActiveAvatars,
    validateAvatarsForScenarios
  };
}
