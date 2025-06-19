import { useState, useEffect, useCallback } from 'react';
import { storageUtils } from '@/utils/storage';

export interface MissionalAvatar {
  id: string;
  name: string;
  role: 'missional';
  avatar_url?: string;
  image_url?: string;
  description?: string;
  avatar_name: string;
  avatar_point_of_view: string;
}

export function useMissionalAvatars() {
  const [selectedMissionalAvatar, setSelectedMissionalAvatar] = useState<MissionalAvatar | null>(null);
  const [missionalAvatars, setMissionalAvatars] = useState<MissionalAvatar[]>([]);

  // Load stored selection from localStorage on component mount
  useEffect(() => {
    const storedAvatar = storageUtils.getItem<MissionalAvatar | null>('selected_missional_avatar', null);
    if (storedAvatar) {
      setSelectedMissionalAvatar(storedAvatar);
    }
    
    // Load stored missional avatars list
    const storedAvatars = storageUtils.getItem<MissionalAvatar[]>('missional_avatars', []);
    setMissionalAvatars(storedAvatars);
  }, []);

  // Select a missional avatar
  const selectMissionalAvatar = useCallback((avatar: MissionalAvatar | null) => {
    setSelectedMissionalAvatar(avatar);
    if (avatar) {
      storageUtils.setItem('selected_missional_avatar', avatar);
    } else {
      storageUtils.removeItem('selected_missional_avatar');
    }
  }, []);

  // Add a new missional avatar to the list
  const addMissionalAvatar = useCallback((avatar: MissionalAvatar) => {
    // Check if avatar with same name already exists
    const existingAvatar = missionalAvatars.find(a => a.avatar_name === avatar.avatar_name);
    if (existingAvatar) {
      return false;
    }

    setMissionalAvatars(prev => {
      const newAvatars = [...prev, avatar];
      storageUtils.setItem('missional_avatars', newAvatars);
      return newAvatars;
    });
    return true;
  }, [missionalAvatars]);

  // Remove a missional avatar from the list
  const removeMissionalAvatar = useCallback((avatarId: string) => {
    setMissionalAvatars(prev => {
      const newAvatars = prev.filter(avatar => avatar.id !== avatarId);
      storageUtils.setItem('missional_avatars', newAvatars);
      return newAvatars;
    });
    
    // If the removed avatar was selected, clear the selection
    if (selectedMissionalAvatar && selectedMissionalAvatar.id === avatarId) {
      selectMissionalAvatar(null);
    }
  }, [selectedMissionalAvatar, selectMissionalAvatar]);

  // Check if a missional avatar is active (selected)
  const isMissionalAvatarActive = useCallback((): boolean => {
    return Boolean(selectedMissionalAvatar);
  }, [selectedMissionalAvatar]);

  return {
    selectedMissionalAvatar,
    missionalAvatars,
    selectMissionalAvatar,
    addMissionalAvatar,
    removeMissionalAvatar,
    isMissionalAvatarActive
  };
}
