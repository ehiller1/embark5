import { useMemo } from 'react';
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";

interface UseUserRoleReturn {
  user: any; // From AuthProvider
  profile: any; // From UserProfileProvider
  role: string | null;
  isLoading: boolean;
  error: Error | null;
  isClergy: boolean;
  isAuthenticated: boolean;
}

/**
 * A simplified hook that combines authentication and user profile state
 * for role-based access control.
 * 
 * This hook uses the new separated auth providers (AuthProvider and UserProfileProvider)
 * and provides a backward-compatible API for existing components.
 */
export function useUserRole(): UseUserRoleReturn {
  // Get auth state from AuthProvider
  const { 
    user,
    isLoading: authLoading,
    error: authError,
    isAuthenticated
  } = useAuth();

  // Get profile state from UserProfileProvider
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    role,
    isClergy
  } = useUserProfile();

  // Combine loading states
  const isLoading = authLoading || profileLoading;
  
  // Combine errors (prefer auth error if exists)
  const error = authError || profileError;

  // Log combined state for debugging in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      console.log('[useUserRole] Auth state update:', { 
        hasUser: !!user,
        isAuthenticated,
        userId: user?.id,
        hasProfile: !!profile,
        isLoading,
        role
      });
    }, [user, isAuthenticated, profile, isLoading, role]);
  }

  // Return the combined state
  return {
    user,
    profile,
    role,
    isLoading,
    error,
    isClergy,
    isAuthenticated
  };
}
