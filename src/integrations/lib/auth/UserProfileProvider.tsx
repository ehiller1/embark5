import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';

// Define the UserProfile type
export interface UserProfile {
  id: string;
  role: string | null;
  name?: string;
  church_name?: string;
  phone?: string;
  church_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for additional fields
}

// Define the UserProfileState interface
export interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
}

// Define the UserProfileContext interface
export interface UserProfileContextType extends UserProfileState {
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  role: string | null; // Derived from profile
  isClergy: boolean; // Derived from role
}

// Create the context
const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  isLoading: false,
  error: null,
  refreshProfile: async () => {},
  updateProfile: async () => ({ error: null }),
  role: null,
  isClergy: false
});

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  // Get auth state from AuthProvider
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<UserProfileState>({
    profile: null,
    isLoading: false,
    error: null
  });

  const { toast } = useToast();

  // Derived state
  const role = useMemo(() => state.profile?.role || null, [state.profile]);
  const isClergy = useMemo(() => role === 'Clergy' || role === 'Admin', [role]);
  
  // Fetch user profile when authenticated user changes
  useEffect(() => {
    // Log current state for debugging
    console.log('[UserProfile] Auth state changed:', { 
      isAuthenticated, 
      hasUser: !!user,
      userId: user?.id,
      email: user?.email
    });
    
    // Skip if not authenticated or no user
    if (!isAuthenticated || !user) {
      setState({
        profile: null,
        isLoading: false,
        error: null
      });
      return;
    }
    
    // Load profile
    const fetchProfile = async () => {
      // Set loading state
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        console.log('[UserProfile] Fetching profile for user:', user.id);
        
        
        // Attempt to get the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.warn('[UserProfile] Error fetching profile:', error);
          
          // If profile doesn't exist, create a default one
          if (error.code === 'PGRST116') { // Record not found error code
            console.log('[UserProfile] Profile not found, creating default profile');
            return await createDefaultProfile(user.id);
          }
          
          // Otherwise, handle as a normal error
          throw new Error(error.message);
        }
        
        console.log('[UserProfile] Profile loaded successfully:', { 
          role: data.role,
          name: data.name || '(not set)',
          id: data.id
        });
        
        setState({
          profile: data as UserProfile,
          isLoading: false,
          error: null
        });
      } catch (err) {
        console.error('[UserProfile] Error in profile fetch:', err);
        setState({
          profile: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Unknown error fetching profile')
        });
        
        // Only show the toast if the user is still on the page
        // and if the error isn't just a profile not found error
        if (!(err instanceof Error && err.message.includes('not found'))) {
          toast({
            title: 'Profile Error',
            description: 'Failed to load your profile data',
            variant: 'destructive'
          });
        }
      }
    };
    
    // Start fetching the profile
    fetchProfile();
  }, [user, isAuthenticated]);
  
  // Helper function to create a default profile
  const createDefaultProfile = async (userId: string) => {
    try {
      
      
      // Create a default profile with the Clergy role
      const defaultProfile: Partial<UserProfile> = {
        id: userId,
        role: 'Clergy', // Default role
        name: '',
        church_name: '',
        phone: '',
        church_id: undefined
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(defaultProfile)
        .select()
        .single();
      
      if (error) {
        console.error('[UserProfile] Failed to create default profile:', error);
        throw new Error(error.message);
      }
      
      console.log('[UserProfile] Default profile created successfully');
      setState({
        profile: data as UserProfile,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('[UserProfile] Error creating default profile:', err);
      
      // Return a fallback profile even if DB insert fails
      const fallbackProfile: UserProfile = {
        id: userId,
        role: 'Clergy',
        name: '',
        church_name: '',
        phone: '',
        church_id: undefined
      };
      
      setState({
        profile: fallbackProfile,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to create profile')
      });
      
      toast({
        title: 'Profile Warning',
        description: 'Using temporary profile due to database error',
        variant: 'destructive'
      });
    }
  };
  
  // Refresh the user profile manually
  const refreshProfile = async () => {
    if (!user) {
      console.warn('[UserProfile] Cannot refresh profile - no authenticated user');
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('[UserProfile] Refreshing profile for user:', user.id);
      
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('[UserProfile] Profile refreshed successfully');
      setState({
        profile: data as UserProfile,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('[UserProfile] Error refreshing profile:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Unknown error refreshing profile')
      }));
    }
  };
  
  // Update the user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !state.profile) {
      console.error('[UserProfile] Cannot update profile - no user or profile');
      return { error: new Error('Cannot update profile - not authenticated') };
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('[UserProfile] Updating profile for user:', user.id);
      
      
      // Add updated_at timestamp
      const profileUpdates = { ...updates };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('[UserProfile] Profile updated successfully');
      setState({
        profile: data as UserProfile,
        isLoading: false,
        error: null
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully'
      });
      
      return { error: null };
    } catch (err) {
      console.error('[UserProfile] Error updating profile:', err);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Unknown error updating profile')
      }));
      
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive'
      });
      
      return { 
        error: err instanceof Error ? err : new Error('Failed to update profile')
      };
    }
  };
  
  // Log state changes in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      console.log('[UserProfile] State update:', { 
        hasProfile: !!state.profile, 
        role,
        isClergy,
        isLoading: state.isLoading,
        hasError: !!state.error
      });
    }, [state.profile, role, isClergy, state.isLoading, state.error]);
  }
  
  return (
    <UserProfileContext.Provider
      value={{
        ...state,
        refreshProfile,
        updateProfile,
        role,
        isClergy
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

// Custom hook to use the user profile context
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  
  return context;
};
