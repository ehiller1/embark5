
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNarrativeAvatar } from './useNarrativeAvatar';
import { useSelectedCompanion } from './useSelectedCompanion';

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
    churchAvatar, 
    communityAvatar,
    churchAvatars,
    communityAvatars
  } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const missingAvatars = {
    church: !churchAvatar,
    community: !communityAvatar,
    companion: !selectedCompanion,
  };

  const avatarsReady = !missingAvatars.church && !missingAvatars.community && !missingAvatars.companion;

  const retryLoading = () => {
    setIsLoading(true);
    setError(null);
    setLoadAttempts(prev => prev + 1);
  };

  useEffect(() => {
    const checkAvatars = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Avatars are loaded via the useNarrativeAvatar hook
        // Just check if we have the data we need
        if (churchAvatars.length === 0 || communityAvatars.length === 0) {
          setError('Failed to load avatars. Please try again.');
        }
        
      } catch (err) {
        console.error('Error checking avatars:', err);
        setError('Failed to load avatars. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAvatars();
  }, [churchAvatars, communityAvatars, loadAttempts]);

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
