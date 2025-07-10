import { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Loader2 } from 'lucide-react';

interface UserMenuProps {
  onLogout: () => void;
}

export const UserMenu = ({ onLogout }: UserMenuProps) => {
  // Use the new auth and user profile hooks
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  // Combine loading states
  const isLoading = authLoading || isProfileLoading;
  
  // Memoize the handlers to prevent unnecessary re-renders
  // IMPORTANT: All hooks must be called in the same order on every render
  // so we define both callbacks unconditionally, regardless of env
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

  // Get the user's name based on role
  let userName = 'User';
  
  if (profile?.role === 'Clergy') {
    // For Clergy, use church_name if available
    userName = profile?.church_name || 
              profile?.name || 
              user.user_metadata?.full_name ||
              user.user_metadata?.name || 
              user.email?.split('@')[0] || 
              'User';
  } else if (profile?.preferred_name) {
    // For users with preferred_name, use that
    userName = profile.preferred_name;
  } else {
    // Default: first name + last initial
    const firstName = profile?.first_name || user.user_metadata?.firstName || user.user_metadata?.first_name || '';
    const lastName = profile?.last_name || user.user_metadata?.lastName || user.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      userName = `${firstName} ${lastName.charAt(0)}.`;
    } else {
      userName = profile?.name || 
                user.user_metadata?.full_name ||
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'User';
    }
  }
  
  // Logging removed to reduce console noise

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
