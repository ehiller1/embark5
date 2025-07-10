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
    churchAvatar,
    communityAvatar,
  } = useNarrativeAvatar();
  
  const [activeAvatars, setActiveAvatars] = useState<AvatarType[]>([]);

  // Initialize and sync activeAvatars based on selected avatars
  useEffect(() => {
    const newActiveAvatars: AvatarType[] = [];
    
    if (churchAvatar) {
      newActiveAvatars.push('church');
    }
    
    if (communityAvatar) {
      newActiveAvatars.push('community');
    }
    
    if (selectedCompanion) {
      newActiveAvatars.push('companion');
    }

    setActiveAvatars(newActiveAvatars);
    
    // Update localStorage to persist active avatar state
    localStorage.setItem('active_avatars', JSON.stringify(newActiveAvatars));
  }, [churchAvatar, communityAvatar, selectedCompanion]);
  
  // Create avatarData object with all selected avatars
  const avatarData: AvatarData = {
    church: churchAvatar,
    community: communityAvatar,
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

  const validateAvatarsForScenarios = useCallback((requiredTypes: AvatarType[] = ['church', 'community']): boolean => {
    // By default, require church and community avatars, but allow customization
    const missing = requiredTypes.filter(type => !isAvatarActive(type));
    return missing.length === 0;
  }, [isAvatarActive]);

  const generateMessagesForActiveAvatars = useCallback(() => {
    // For message generation, we still require both church and community avatars
    if (!validateAvatarsForScenarios(['church', 'community'])) {
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
