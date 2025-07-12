import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { User } from '@supabase/supabase-js';

// -- Types
export interface UserProfile {
  id: string;
  role: string | null;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  church_name?: string;
  phone?: string;
  church_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  hasProfile: boolean;
  profileFetchAttempted: boolean;
}

export interface UserProfileContextType extends UserProfileState {
  refreshProfile: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: Error | null }>;
  role: string | null;
  isClergy: boolean;
  hasProfile: boolean;
  profileFetchAttempted: boolean;
}

// -- Context
const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  isLoading: false,
  error: null,
  hasProfile: false,
  profileFetchAttempted: false,
  refreshProfile: async () => ({ success: false, error: 'Context not initialized' }),
  updateProfile: async () => ({ data: null, error: null }),
  role: null,
  isClergy: false,
});

// Named function component for better Fast Refresh compatibility
export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMounted = useRef(true);

  const [profileState, setProfileState] = useState<UserProfileState>({
    profile: null,
    isLoading: false,
    error: null,
    hasProfile: false,
    profileFetchAttempted: false,
  });

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const createDefaultProfile = useCallback(async (user: User) => {
    const timestamp = new Date().toISOString();
    console.log(`[UserProfileProvider] [${timestamp}] No profile found for ${user.id}. Creating default.`);

    try {
      // First check if a profile already exists (double-check)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        console.log(`[UserProfileProvider] [${timestamp}] Profile already exists, returning existing profile.`);
        return existingProfile as UserProfile;
      }
      
      const profileData = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'Clergy',
        first_name: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
        church_name: user.user_metadata?.churchName || user.user_metadata?.church_name || '',
        church_id: user.user_metadata?.church_id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(`[UserProfileProvider] [${timestamp}] Inserting new profile with data:`, profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error(`[UserProfileProvider] [${timestamp}] Error creating default profile:`, error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      if (!data) {
        throw new Error('Profile creation returned no data');
      }

      console.log(`[UserProfileProvider] [${timestamp}] Default profile created successfully:`, data);
      return data as UserProfile;
    } catch (err) {
      console.error(`[UserProfileProvider] [${timestamp}] Exception in createDefaultProfile:`, err);
      throw err;
    }
  }, []);

  const fetchProfile = useCallback(async (user: User) => {
    const timestamp = new Date().toISOString();
    console.log(`[UserProfileProvider] [${timestamp}] Fetching profile for user: ${user.id}`);

    setProfileState(prev => ({ ...prev, isLoading: true, error: null, profileFetchAttempted: true }));

    console.log(`[UserProfileProvider] [${timestamp}] Preparing to query Supabase for profile.`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log(`[UserProfileProvider] [${timestamp}] Supabase query completed. Error: ${error ? JSON.stringify(error) : 'null'}. Data received: ${!!data}`);

      let finalProfile: UserProfile | null = data;

      if (error && error.code !== 'PGRST116') { // PGRST116 = 'single row not found'
        console.error(`[UserProfileProvider] [${timestamp}] Error fetching profile:`, error);
        throw error;
      }

      if (!data) {
        finalProfile = await createDefaultProfile(user);
      }

      if (isMounted.current) {
        console.log(`[UserProfileProvider] [${timestamp}] Profile loaded successfully.`);
        setProfileState({
          profile: finalProfile,
          isLoading: false,
          error: null,
          hasProfile: true,
          profileFetchAttempted: true,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        const e = err instanceof Error ? err : new Error('Unknown error fetching profile');
        console.error(`[UserProfileProvider] [${timestamp}] Failed to fetch or create profile:`, e);
        setProfileState({
          profile: null,
          isLoading: false,
          error: e,
          hasProfile: false,
          profileFetchAttempted: true,
        });
        toast({ title: 'Profile Error', description: 'Failed to load your profile.', variant: 'destructive' });
      }
    }
  }, [createDefaultProfile, toast]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      const error = new Error('Cannot update profile - no user authenticated');
      console.error(`[UserProfileProvider] ${error.message}`);
      return { data: null, error };
    }

    setProfileState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (isMounted.current) {
        setProfileState(prev => ({ ...prev, profile: data as UserProfile, isLoading: false, error: null }));
        toast({ title: 'Profile Updated', description: 'Your profile has been updated.' });
      }
      return { data: data as UserProfile, error: null };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to update profile');
      if (isMounted.current) {
        setProfileState(prev => ({ ...prev, isLoading: false, error: e }));
        toast({ title: 'Update Failed', description: e.message, variant: 'destructive' });
      }
      return { data: null, error: e };
    }
  }, [user, toast]);

  const refreshProfile = useCallback(async () => {
    if (!user) return { success: false, error: 'No authenticated user' };
    await fetchProfile(user);
    return { success: true };
  }, [user, fetchProfile]);

  const resetProfileState = useCallback(() => {
    if (isMounted.current) {
      setProfileState({
        profile: null,
        isLoading: false,
        error: null,
        hasProfile: false,
        profileFetchAttempted: false,
      });
    }
  }, []);

  useEffect(() => {
    // Enhanced debug logging for profile state
    console.log(`%c[UserProfileProvider] Profile State Debug:`, 'color: green; font-weight: bold;', {
      userId: user?.id,
      profileFetchAttempted: profileState.profileFetchAttempted,
      hasProfile: !!profileState.profile,
      profileId: profileState.profile?.id,
      profileRole: profileState.profile?.role,
      isLoading: profileState.isLoading,
      timestamp: new Date().toISOString(),
    });
    
    // Fetch profile only if we have a user and haven't tried fetching yet.
    if (user && !profileState.profileFetchAttempted) {
      console.log(`%c[UserProfileProvider] Initiating profile fetch for user ${user.id}`, 'color: green; font-weight: bold;');
      fetchProfile(user);
    } 
    // Reset profile state if user logs out.
    else if (!user && profileState.profile) {
      console.log(`%c[UserProfileProvider] User logged out, resetting profile state`, 'color: green; font-weight: bold;');
      resetProfileState();
    }
    // Ensure loading state is reset if it's been loading for too long
    else if (profileState.isLoading && profileState.profileFetchAttempted) {
      const loadingTimeout = setTimeout(() => {
        console.log(`%c[UserProfileProvider] Loading timeout reached, resetting loading state`, 'color: orange; font-weight: bold;');
        setProfileState(prev => ({ ...prev, isLoading: false }));
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(loadingTimeout);
    }
  }, [user, profileState.profileFetchAttempted, profileState.profile, fetchProfile, resetProfileState]);

  const contextValue = useMemo<UserProfileContextType>(() => ({
    ...profileState,
    refreshProfile,
    updateProfile,
    role: profileState.profile?.role || null,
    isClergy: profileState.profile?.role === 'Clergy',
  }), [profileState, refreshProfile, updateProfile]);

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

// -- Hook with named function for better Fast Refresh compatibility
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
