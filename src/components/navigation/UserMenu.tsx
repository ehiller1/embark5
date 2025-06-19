
import { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// Remove old auth import and rely solely on the useUserRole hook
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface UserMenuProps {
  onLogout: () => void;
}

export const UserMenu = ({ onLogout }: UserMenuProps) => {
  // Use only the new useUserRole hook which combines auth and profile state
  const { isAuthenticated, user, profile, isLoading } = useUserRole();
  
  // Memoize the onLogout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    console.log('[UserMenu] Logout clicked');
    onLogout();
  }, [onLogout]);
  
  // Debug logging - only log when values change
  const prevStateRef = useRef<{
    isAuthenticated: boolean;
    hasUser: boolean;
    hasProfile: boolean;
    isLoading: boolean;
  } | null>(null);
  
  useEffect(() => {
    const currentState = { 
      isAuthenticated, 
      hasUser: !!user,
      hasProfile: !!profile,
      isLoading 
    };
    
    // Only log if state has changed
    if (JSON.stringify(prevStateRef.current) !== JSON.stringify(currentState)) {
      console.log('[UserMenu] Auth state changed:', currentState);
      // Explicitly assign to a new object to satisfy TypeScript
      prevStateRef.current = {
        isAuthenticated: currentState.isAuthenticated,
        hasUser: currentState.hasUser,
        hasProfile: currentState.hasProfile,
        isLoading: currentState.isLoading
      };
    }
  }, [isAuthenticated, user, profile, isLoading]);

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }
  
  // If not authenticated, don't render anything
  if (!isAuthenticated || !user) {
    console.log('[UserMenu] Not rendering - not authenticated or no user');
    return null;
  }

  // Get the user's name from profile, user_metadata, or email
  const userName = profile?.name || 
                 user.user_metadata?.full_name ||
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 'User';
  
  console.log('[UserMenu] User name resolved:', { 
    fromProfile: profile?.name,
    fromUserMetadata: user.user_metadata?.name || user.user_metadata?.full_name,
    fromEmail: user.email?.split('@')[0],
    finalName: userName
  });
  
  return (
    <div className="hidden md:flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Welcome, <span className="font-medium text-journey-pink">{userName}</span>
      </span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout}
        className="border-journey-pink/30 hover:border-journey-pink/50 hover:bg-journey-lightPink/20"
      >
        Sign Out
      </Button>
    </div>
  );
};
