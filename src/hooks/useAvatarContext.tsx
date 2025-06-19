
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNarrativeAvatar } from './useNarrativeAvatar';
import { useSelectedCompanion } from './useSelectedCompanion';
import { toast } from './use-toast';

interface AvatarContextState {
  isLoading: boolean;
  error: string | null;
  missingAvatars: {
    church: boolean;
    community: boolean;
    companion: boolean;
  };
  avatarsReady: boolean;
  retryLoading: () => void;
}

const AvatarContext = createContext<AvatarContextState | null>(null);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { 
    selectedChurchAvatar, 
    selectedCommunityAvatar,
    fetchChurchAvatars,
    fetchCommunityAvatars
  } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const missingAvatars = {
    church: !selectedChurchAvatar,
    community: !selectedCommunityAvatar,
    companion: !selectedCompanion
  };

  const avatarsReady = !missingAvatars.church && !missingAvatars.community && !missingAvatars.companion;

  const retryLoading = () => {
    setIsLoading(true);
    setError(null);
    setLoadAttempts(prev => prev + 1);
  };

  useEffect(() => {
    const loadAvatars = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchChurchAvatars(),
          fetchCommunityAvatars()
        ]);
        setIsLoading(false);
      } catch (err) {
        console.error('[AvatarContext] Error loading avatars:', err);
        setError('Failed to load avatars. Please try again.');
        setIsLoading(false);
        toast({
          title: "Error loading avatars",
          description: "We couldn't load the avatar data. Please try again.",
          variant: "destructive"
        });
      }
    };

    loadAvatars();
  }, [loadAttempts, fetchChurchAvatars, fetchCommunityAvatars]);

  return (
    <AvatarContext.Provider value={{
      isLoading,
      error,
      missingAvatars,
      avatarsReady,
      retryLoading
    }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatarContext() {
  const context = useContext(AvatarContext);
  
  if (!context) {
    throw new Error('useAvatarContext must be used within an AvatarProvider');
  }
  
  return context;
}
