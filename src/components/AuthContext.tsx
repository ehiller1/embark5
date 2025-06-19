// THIS IS NOW A COMPATIBILITY WRAPPER FOR THE NEW AUTH SYSTEM
// For new code, use the providers in @/integrations/lib/auth/ directly
import { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthProvider as NewAuthProvider, useAuth as useNewAuth } from '@/integrations/lib/auth/AuthProvider';
import { UserProfileProvider, useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { supabase } from '@/integrations/lib/supabase';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any } | void>;
  signup: (email: string, password: string) => Promise<{ error: any } | undefined>;
  logout: () => Promise<void>;
  update: (updates: any) => Promise<void>;
  userProfile: any;
  profileLoading: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  session: null,
  login: async () => ({ error: null }),
  signup: async () => ({ error: null }),
  logout: async () => {},
  update: async () => {},
  userProfile: null,
  profileLoading: false,
  refreshAuth: async () => {}
});

// This is now a wrapper around the new providers for backward compatibility
export function AuthProvider({ children }: { children: ReactNode }) {
  // The new providers handle all the state - this is just a compatibility wrapper
  return (
    <NewAuthProvider>
      <UserProfileProvider>
        <LegacyContextProvider>{children}</LegacyContextProvider>
      </UserProfileProvider>
    </NewAuthProvider>
  );
};

// This component connects the new auth system to the old context interface
function LegacyContextProvider({ children }: { children: ReactNode }) {
  const { user, session, signOut: newSignOut, loading: authLoading } = useNewAuth(); // Get what's available from new provider
  const { profile: userProfile, isLoading: profileLoading, updateProfile, refreshProfile } = useUserProfile();

  const isAuthenticated = !!user;

  // Legacy login function using supabase.auth
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    // Potentially trigger profile refresh or rely on onAuthStateChange
  };

  // Legacy signup function using supabase.auth
  const signup = async (email: string, password: string) => {
    // The new AuthProvider doesn't handle profile creation on signup directly anymore.
    // This was moved to AuthModal and backend triggers.
    // So, this legacy signup will just perform auth.signUp.
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    // data.user contains the new user, data.session for the session
    return { error: null }; // Mimic old structure if no error
  };

  // Legacy logout function maps to new signOut
  const logout = async () => {
    await newSignOut();
  };

  // Legacy update function that maps to the new profile system
  const update = async (updates: any) => {
    // Ensure userProfile is not null and has an id before updating
    if (userProfile && userProfile.id) {
      await updateProfile({ ...updates, id: userProfile.id });
    } else {
      console.error('UserProfile or UserProfile.id is not available for update.');
      // Potentially return an error or handle as appropriate
    }
  };

  // Legacy refreshAuth function - new AuthProvider handles this via onAuthStateChange
  // and getSession on load. If explicit refresh is needed for legacy consumers:
  const refreshAuth = async () => {
    await supabase.auth.refreshSession(); // This will trigger onAuthStateChange
    await refreshProfile(); // Also refresh user profile
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        session,
        login,
        signup,
        logout,
        update,
        userProfile,
        profileLoading: profileLoading || authLoading, // Combine loading states
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export useAuthContext for backward compatibility
export function useAuthContext() {
  return useContext(AuthContext);
}

// Use the auth context with proper typing
function useAuth() {
  return useContext(AuthContext);
}
export { useAuth };
