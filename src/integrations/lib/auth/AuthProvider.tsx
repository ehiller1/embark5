import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

// Define the shape of the user data for signup
interface SignUpUserData {
  firstName: string;
  lastName: string;
  email: string;
  churchName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  role: 'Clergy' | 'Parish';
  church_id?: string;
}

// Define the shape of the Auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ session: Session | null; user: User | null; error: AuthError | null; }>;
  signup: (email: string, pass: string, userData: SignUpUserData) => Promise<{ session: Session | null; user: User | null; error: AuthError | Error | null; }>;
  signOut: () => Promise<void>;
}

// Create the Auth context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes in auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user?.id) {
          // For demo purposes, update all network_connections to this user's ID
          await updateNetworkConnectionsForDemo(session.user.id);
        }
      }
    );

    // Cleanup the listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // For demo: Update all network_connections to the current user's ID
  const updateNetworkConnectionsForDemo = async (userId: string) => {
    if (!userId) return;

    try {
      console.log(`[AuthProvider] Demo mode: Updating network_connections for user ${userId}`);
      // Correct approach to update all rows (or rows not matching the current user):
      // To update all rows to the new userId, regardless of their current user_id:
      // This is tricky with Supabase client's row-level security (RLS) and update policies.
      // A direct update of ALL rows might be restricted.
      // The most straightforward way if RLS allows, is to update where user_id is not null (or some other broad condition)
      // For the demo, let's assume we want to change any existing user_id to the new one.
      const { error: updateError } = await supabase
        .from('network_connections')
        .update({ user_id: userId })
        .neq('user_id', 'dummy-value-to-ensure-update-all-for-demo'); // This ensures the filter doesn't prevent updates
        // A .isNotNull('user_id') or similar could also work if RLS allows broad updates.

      if (updateError) {
        console.error('[AuthProvider] Error updating network_connections for demo:', updateError);
      } else {
        console.log('[AuthProvider] Demo mode: Successfully updated network_connections.');
      }
    } catch (err) {
      console.error('[AuthProvider] Exception during network_connections update for demo:', err);
    }
  };

  // Function to sign in the user
  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { session: data.session, user: data.user, error };
  };

  // Function to sign up the user
  const signup = async (email: string, pass: string, userData: SignUpUserData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          church_name: userData.churchName,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          phone: userData.phone,
          role: userData.role,
          church_id: userData.church_id ?? null,
        },
      },
    });

    return { session: data.session, user: data.user, error };
  };

  // Function to sign out the user
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAuthenticated = !!user;

  const value = {
    session,
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
