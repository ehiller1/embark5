import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/lib/supabase';

export interface UserProfile {
  id: string;
  email: string | null;
  role?: string;
  church_id?: string;
}

export const useUser = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const updateUserWithProfile = async (sessionUser: any) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, church_id')
        .eq('id', sessionUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Return basic user data if profile fetch fails
        return {
          id: sessionUser.id,
          email: sessionUser.email || null,
        };
      }

      // Only include role and church_id if they exist
      return {
        id: sessionUser.id,
        email: sessionUser.email || null,
        ...(profile?.role && { role: profile.role }),
        ...(profile?.church_id && { church_id: profile.church_id }),
      };
    } catch (err) {
      console.error('Error in updateUserWithProfile:', err);
      // Return basic user data if any error occurs
      return {
        id: sessionUser.id,
        email: sessionUser.email || null,
      };
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          const userData = await updateUserWithProfile(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error in useUser:', err);
        setError(err as Error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          const userData = await updateUserWithProfile(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};

export default useUser;
