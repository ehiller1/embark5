import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';

// The UserProfile type is now primarily managed by UserProfileProvider, 
// but we can define a composite type here for the hook's return value.
export interface User {
  id: string;
  email: string | undefined;
  role: string | null;
  [key: string]: any; // Allow other profile properties
}

export const useUser = () => {
  const { user: authUser, loading: authLoading, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile();

  // Combine auth user and profile data into a single user object
  const user: User | null = isAuthenticated && authUser && profile
    ? {
        id: authUser.id,
        email: authUser.email,
        ...profile, // Spread the rest of the profile properties
      }
    : null;

  // The overall loading state is true if either auth or profile is loading
  const loading = authLoading || profileLoading;

  return { user, loading, error: profileError, isAuthenticated };
};

export default useUser;
