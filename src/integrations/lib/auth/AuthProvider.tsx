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
      
      // First, check if table exists before attempting operations
      try {
        // Simple check query to verify if the table exists
        const { count, error: countError } = await supabase
          .from('network_connections')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          // Table likely doesn't exist, silently skip the update
          console.log('[AuthProvider] network_connections table not available, skipping demo update');
          return;
        }
        
        console.log(`[AuthProvider] network_connections table exists with ${count} rows`);
      } catch (checkErr) {
        // If there's any error checking the table, log and exit
        console.warn('[AuthProvider] Error checking network_connections table:', checkErr);
        return;
      }
      
      // Update rows where user_id is null
      const { error: nullUpdateError } = await supabase
        .from('network_connections')
        .update({ user_id: userId })
        .is('user_id', null);

      if (nullUpdateError) {
        console.error('[AuthProvider] Error updating null user_id network_connections:', nullUpdateError);
      } else {
        console.log('[AuthProvider] Demo mode: Successfully updated network_connections with null user_id.');
      }
      
      // Then get all existing connections with a simple select and update them in batches
      try {
        // Get all IDs first (limit to reasonable batch size)
        const { data: existingConnections, error: fetchError } = await supabase
          .from('network_connections')
          .select('id')
          .not('user_id', 'is', null)
          .not('user_id', 'eq', userId) // Only update rows that don't already have this user ID
          .limit(100); 
          
        if (fetchError) {
          console.error('[AuthProvider] Error fetching network connections:', fetchError);
          return;
        }
        
        if (existingConnections && existingConnections.length > 0) {
          const ids = existingConnections.map(conn => conn.id);
          console.log(`[AuthProvider] Found ${ids.length} connections to update`);
          
          // Update in smaller batches of 20 to avoid potential issues
          const batchSize = 20;
          let successCount = 0;
          
          for (let i = 0; i < ids.length; i += batchSize) {
            const batchIds = ids.slice(i, i + batchSize);
            
            const { error: batchUpdateError } = await supabase
              .from('network_connections')
              .update({ user_id: userId })
              .in('id', batchIds);
              
            if (batchUpdateError) {
              console.error(`[AuthProvider] Error updating batch ${i/batchSize + 1}:`, batchUpdateError);
            } else {
              successCount += batchIds.length;
              console.log(`[AuthProvider] Updated batch ${i/batchSize + 1} (${batchIds.length} connections)`);
            }
          }
          
          console.log(`[AuthProvider] Demo mode: Successfully updated ${successCount}/${ids.length} existing network_connections.`);
        } else {
          console.log('[AuthProvider] No existing connections found that need updating.');
        }
      } catch (batchErr) {
        console.error('[AuthProvider] Exception during batch network_connections update:', batchErr);
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
