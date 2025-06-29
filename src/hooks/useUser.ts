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
  let user: User | null = null;
  if (isAuthenticated && authUser && profile) {
    // Omit `id` from profile to prevent duplicate keys when merging
    const { id: _ignoredId, ...profileWithoutId } = profile as Record<string, any>;
    user = {
      id: authUser.id,
      email: authUser.email,
      ...profileWithoutId,
    } as User;
  }


  // The overall loading state is true if either auth or profile is loading
  const loading = authLoading || profileLoading;

  return { user, loading, error: profileError, isAuthenticated };
};

export default useUser;
