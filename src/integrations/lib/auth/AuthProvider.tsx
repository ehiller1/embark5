

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/lib/supabase';


interface SignUpUserData {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  churchName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  role: 'Clergy' | 'Parish';
  church_id?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ session: Session | null; user: User | null; error: AuthError | null }>;
  signup: (email: string, pass: string, userData: SignUpUserData) => Promise<{ session: Session | null; user: User | null; error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Named function component for better Fast Refresh compatibility
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initAttemptRef = useRef(0);
  const maxInitAttempts = 3;

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[AuthProvider] [${timestamp}] Initializing auth`);
    
    // Check for existing session in localStorage to help with debugging
    try {
      const localStorageKeys = Object.keys(localStorage);
      const supabaseKeys = localStorageKeys.filter(key => key.includes('supabase'));
      console.log(`[AuthProvider] [${timestamp}] Found ${supabaseKeys.length} Supabase-related localStorage keys:`, supabaseKeys);
    } catch (e) {
      console.warn(`[AuthProvider] [${timestamp}] Unable to check localStorage:`, e);
    }
    
    const initialize = async () => {
      const initTimestamp = new Date().toISOString();
      initAttemptRef.current += 1;
      
      try {
        console.log(`[AuthProvider] [${initTimestamp}] Getting initial session (attempt ${initAttemptRef.current}/${maxInitAttempts})`);
        
        // Get initial session with timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session fetch timed out after 10 seconds')), 10000);
        });
        
        // Race the session fetch against a timeout
        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as {
          data: { session: Session | null };
          error: Error | null;
        };
        
        if (error) {
          console.error(`[AuthProvider] [${initTimestamp}] Error getting initial session:`, error.message);
          throw error;
        }
        
        console.log(`[AuthProvider] [${initTimestamp}] Initial session loaded:`, { 
          hasSession: !!data.session, 
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email,
          expiresAt: data.session?.expires_at
        });
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error(`[AuthProvider] [${initTimestamp}] Error during auth initialization:`, err);
        
        // Retry logic for initialization
        if (initAttemptRef.current < maxInitAttempts) {
          const retryDelay = 1000 * Math.pow(2, initAttemptRef.current - 1);
          console.log(`[AuthProvider] [${initTimestamp}] Will retry initialization in ${retryDelay}ms (attempt ${initAttemptRef.current + 1}/${maxInitAttempts})`);
          
          setTimeout(initialize, retryDelay);
          return; // Don't set isLoading to false yet
        }
      } finally {
        if (initAttemptRef.current >= maxInitAttempts || session) {
          console.log(`[AuthProvider] [${initTimestamp}] Initialization complete after ${initAttemptRef.current} attempt(s)`);
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthProvider] Auth state changed:', { event: _event, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    console.log('[AuthProvider] Login attempt with email:', email);
    try {
      const loginPromise = supabase.auth.signInWithPassword({ email, password: pass });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timed out after 10 seconds')), 10000);
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as { 
        data: { session: Session | null; user: User | null; }; 
        error: AuthError | null; 
      };

      if (error) {
        console.error('[AuthProvider] Login error:', error.message);
        return { session: null, user: null, error };
      }
      
      console.log('[AuthProvider] Login successful, user:', data.user?.id);
      // Proactively set the session to avoid race conditions with the listener
      setSession(data.session);
      setUser(data.user ?? null);

      return { session: data.session, user: data.user, error: null };
    } catch (err) {
      console.error('[AuthProvider] Unexpected login error:', err);
      const error = err instanceof Error ? new AuthError(err.message) : new AuthError('Unknown login error');
      return { session: null, user: null, error };
    }
  }, []);

  const signup = useCallback(async (email: string, pass: string, userData: SignUpUserData) => {
    console.log('[AuthProvider] Signup attempt with email:', email, 'role:', userData.role);
    try {
      // First, create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            preferred_name: userData.preferredName || null,
            church_name: userData.churchName,
            address: userData.address,
            city: userData.city,
            state: userData.state,
            phone: userData.phone,
            role: userData.role,
            church_id: userData.church_id ?? null,
            created_at: new Date().toISOString(),
          },
        },
      });
      
      if (error) {
        console.error('[AuthProvider] Signup error:', error.message);
        return { session: null, user: null, error };
      }
      
      // If user was created successfully, update the profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            preferred_name: userData.preferredName || null, // Save preferred_name to profiles table
            church_name: userData.churchName,
            address: userData.address,
            city: userData.city,
            state: userData.state,
            phone: userData.phone,
            role: userData.role,
            church_id: userData.church_id ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (profileError) {
          console.error('[AuthProvider] Error updating profiles table:', profileError.message);
          // Don't fail the signup if profile update fails, just log it
        }
      }
      
      console.log('[AuthProvider] Signup successful, user:', data.user?.id, 'email confirmation needed:', !data.session);
      return { session: data.session, user: data.user, error: null };
    } catch (err) {
      console.error('[AuthProvider] Unexpected signup error:', err);
      const error = err instanceof Error ? err : new Error('Unknown signup error');
      return { session: null, user: null, error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthProvider] Sign out requested');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthProvider] Error during sign out:', error.message);
        throw error;
      }
      console.log('[AuthProvider] Sign out successful');
      // Auth state change listener will handle updating the state
    } catch (err) {
      console.error('[AuthProvider] Unexpected error during sign out:', err);
      // Force reset the state in case the listener doesn't trigger
      setSession(null);
      setUser(null);
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated, login, signup, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

