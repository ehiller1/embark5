import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/lib/supabase';

export interface ChurchAvatar {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  image_url?: string;
  description?: string;
  avatar_name: string;
  avatar_point_of_view: string;
  avatar_structured_data?: string;
}

export interface CommunityAvatar {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  image_url?: string;
  description?: string;
  avatar_name: string;
  avatar_point_of_view: string;
  avatar_structured_data?: string;
}

export interface Companion {
  id: string; 
  name: string; 
  avatar_url?: string;
  traits?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
  role: 'companion';
}

export interface NarrativeAvatar {
  id: string;
  name: string;
  role: string;
  avatar_name?: string;
  avatar_point_of_view?: string;
  avatar_structured_data?: string;
  image_url?: string;
  avatar_url?: string;
  selected?: boolean;
}

interface CompletedTasks {
  church: boolean;
  community: boolean;
}

// Database item types for proper type safety when mapping
type ChurchAvatarItem = {
  id: string;
  avatar_name?: string;
  image_url?: string;
  avatar_point_of_view?: string;
  avatar_structured_data?: string;
  created_at?: string;
};

type CommunityAvatarItem = {
  id: string;
  avatar_name?: string;
  image_url?: string;
  avatar_point_of_view?: string;
  avatar_structured_data?: string;
  created_at?: string;
};

type CompanionItem = {
  UUID: string;
  companion?: string;
  avatar_url?: string;
  traits?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
};


// Create the context
const NarrativeAvatarContext = createContext<NarrativeAvatarContextType | undefined>(undefined);

// Define the context type
interface NarrativeAvatarContextType {
  avatars: NarrativeAvatar[];
  churchAvatars: ChurchAvatar[];
  communityAvatars: CommunityAvatar[];
  companions: Companion[];
  churchAvatar: ChurchAvatar | null;
  communityAvatar: CommunityAvatar | null;
  completedTasks: CompletedTasks;
  setCompletedTasks: React.Dispatch<React.SetStateAction<CompletedTasks>>;
  selectCommunityAvatar: (avatar: CommunityAvatar | null) => void;
  selectChurchAvatar: (avatar: ChurchAvatar | null) => void;
  selectCompanion: (companionId: string | null) => void;
  saveChurchAvatar: (avatarData: Partial<ChurchAvatar>) => Promise<any>;
  saveCommunityAvatar: (avatarData: Partial<CommunityAvatar>) => Promise<any>;
  clearSelectedAvatars: () => void;
  markTaskComplete: (task: keyof CompletedTasks) => void;
  unlockTask: (task: keyof CompletedTasks) => void;
  selectedCompanionId: string | null;
  setSelectedCompanionId: React.Dispatch<React.SetStateAction<string | null>>;
  getDefaultChurchIconUrl: () => string;
  getDefaultCommunityIconUrl: () => string;
  isAvatarActive: (id: string, role: string) => boolean;
  toggleAvatar: (avatar: NarrativeAvatar) => void;
  getAvatarByType: (role: string, id: string) => NarrativeAvatar | undefined;
  isInitialized: boolean;
}

// Provider component
export function NarrativeAvatarProvider({ children }: { children: ReactNode }) {
  const narrativeAvatar = useNarrativeAvatarInternal();

  return React.createElement(NarrativeAvatarContext.Provider, { value: narrativeAvatar }, children);
}

// Hook to be used by components
export function useNarrativeAvatar() {
  const context = useContext(NarrativeAvatarContext);
  if (context === undefined) {
    throw new Error('useNarrativeAvatar must be used within a NarrativeAvatarProvider');
  }
  return context;
}

// Internal hook containing the original logic
function useNarrativeAvatarInternal(): NarrativeAvatarContextType {
  const [churchAvatars, setChurchAvatars] = useState<ChurchAvatar[]>([]);
  const [communityAvatars, setCommunityAvatars] = useState<CommunityAvatar[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [churchAvatar, setSelectedChurchAvatar] = useState<ChurchAvatar | null>(null);
  const [communityAvatar, setSelectedCommunityAvatar] = useState<CommunityAvatar | null>(null);
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null);
  const [allAvatars, setAllAvatars] = useState<NarrativeAvatar[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({
    church: false,
    community: false
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Try to load selected avatars from localStorage on initial render
    try {
      const savedChurchAvatar = localStorage.getItem('selected_church_avatar');
      const savedCommunityAvatar = localStorage.getItem('selected_community_avatar');
      const savedCompanionId = localStorage.getItem('selected_companion_id');
      const savedTasks = localStorage.getItem('completed_tasks');
      
      if (savedChurchAvatar) {
        setSelectedChurchAvatar(JSON.parse(savedChurchAvatar));
      }
      
      if (savedCommunityAvatar) {
        setSelectedCommunityAvatar(JSON.parse(savedCommunityAvatar));
      }
      
      if (savedCompanionId) {
        setSelectedCompanionId(savedCompanionId);
      }
      
      if (savedTasks) {
        setCompletedTasks(JSON.parse(savedTasks));
      }
    } catch (err) {
      console.error('Error loading saved avatars from localStorage:', err);
      // Ignore localStorage errors, just use empty state
    }
  }, []);

  const fetchChurchAvatars = useCallback(async () => {
    // First check if we have local storage data - use as fallback immediately
    try {
      const cachedData = localStorage.getItem('church_avatars_cache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('[useNarrativeAvatar] Using cached church avatars:', parsedData.length);
        setChurchAvatars(parsedData);
      }
    } catch (err) {
      console.warn('[useNarrativeAvatar] Error reading cached church avatars:', err);
    }
    
    // Create abort controller for proper timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000); // Reduced to 5-second timeout
    
    try {
      // First, check if table exists before attempting operations
      try {
        // Simple check query to verify if the table exists
        const { count, error: countError } = await supabase
          .from('church_avatars')
          .select('*', { count: 'exact', head: true })
          .limit(1)
          .abortSignal(abortController.signal);
          
        if (countError) {
          // Table likely doesn't exist, use empty data
          console.log('[useNarrativeAvatar] church_avatars table not available, using empty data');
          setChurchAvatars([]);
          setIsInitialized(true);
          return;
        }
        
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[useNarrativeAvatar] church_avatars table exists with approximately ${count} rows`);
        }
      } catch (checkErr) {
        // If there's any error checking the table, continue with main query but log the error
        console.warn('[useNarrativeAvatar] Error checking church_avatars table:', checkErr);
      }
      
      // Only select the fields we need, limit to 20 results to improve query speed
      const { data, error } = await supabase
        .from('church_avatars')
        .select('id, avatar_name, image_url, avatar_point_of_view, avatar_structured_data, created_at') 
        .order('created_at', { ascending: true })
        .limit(20) // Reduced limit for faster response
        .abortSignal(abortController.signal);
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);

      if (error) {
        // Silently ignore abort errors as they are expected on unmount or timeout
        if (error.name !== 'AbortError') {
          console.error('Error fetching church avatars:', error);
        }
        // We already set avatars from cache, so just mark as initialized
        setIsInitialized(true);
        return;
      }
      
      const mappedData = data?.map((item: ChurchAvatarItem) => ({
        id: item.id,
        name: item.avatar_name || '',
        role: 'church',
        image_url: item.image_url || '',
        description: item.avatar_point_of_view || '',
        avatar_name: item.avatar_name || '',
        avatar_point_of_view: item.avatar_point_of_view || '',
        avatar_structured_data: item.avatar_structured_data
      })) || [];
      
      // Cache the data for future use
      if (mappedData.length > 0) {
        try {
          localStorage.setItem('church_avatars_cache', JSON.stringify(mappedData));
        } catch (cacheError) {
          console.warn('[useNarrativeAvatar] Error caching church avatars:', cacheError);
        }
      }
      
      // Logging removed to reduce console noise
      
      setChurchAvatars(mappedData);
      setIsInitialized(true); // Mark as initialized on success
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      
      // Check if this is an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[useNarrativeAvatar] Church avatars fetch timed out after 5 seconds');
      } else {
        console.error('Unexpected error fetching church avatars:', err);
      }
      
      // Always ensure we're initialized even on error
      setIsInitialized(true);
      
      // No more retries - they're causing too many long-running requests
      // We already loaded from cache at the beginning if available
    }
  }, []);

  const fetchCommunityAvatars = useCallback(async () => {
    // First check if we have local storage data - use as fallback immediately
    try {
      const cachedData = localStorage.getItem('community_avatars_cache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('[useNarrativeAvatar] Using cached community avatars:', parsedData.length);
        setCommunityAvatars(parsedData);
      }
    } catch (err) {
      console.warn('[useNarrativeAvatar] Error reading cached community avatars:', err);
    }
    
    // Create abort controller for proper timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000); // Reduced to 5-second timeout
    
    try {
      // First, check if table exists before attempting operations
      try {
        // Simple check query to verify if the table exists
        const { count, error: countError } = await supabase
          .from('community_avatars')
          .select('*', { count: 'exact', head: true })
          .limit(1)
          .abortSignal(abortController.signal);
          
        if (countError) {
          // Table likely doesn't exist, use empty data
          console.log('[useNarrativeAvatar] community_avatars table not available, using empty data');
          setCommunityAvatars([]);
          setIsInitialized(true);
          return;
        }
        
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[useNarrativeAvatar] community_avatars table exists with approximately ${count} rows`);
        }
      } catch (checkErr) {
        // If there's any error checking the table, continue with main query but log the error
        console.warn('[useNarrativeAvatar] Error checking community_avatars table:', checkErr);
      }
      
      // Only select the fields we need, limit to 20 results to improve query speed
      const { data, error } = await supabase
        .from('community_avatars')
        .select('id, avatar_name, image_url, avatar_point_of_view, avatar_structured_data, created_at') 
        .order('created_at', { ascending: true })
        .limit(20) // Reduced limit for faster response
        .abortSignal(abortController.signal);
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);

      if (error) {
        // Silently ignore abort errors as they are expected on unmount or timeout
        if (error.name !== 'AbortError') {
          console.error('Error fetching community avatars:', error);
        }
        // We already set avatars from cache, so just mark as initialized
        setIsInitialized(true);
        return;
      }
      
      const mappedData = data?.map((item: CommunityAvatarItem) => ({
        id: item.id,
        name: item.avatar_name || '',
        role: 'community',
        image_url: item.image_url || '',
        description: item.avatar_point_of_view || '',
        avatar_name: item.avatar_name || '',
        avatar_point_of_view: item.avatar_point_of_view || '',
        avatar_structured_data: item.avatar_structured_data
      })) || [];
      
      // Cache the data for future use
      if (mappedData.length > 0) {
        try {
          localStorage.setItem('community_avatars_cache', JSON.stringify(mappedData));
        } catch (cacheError) {
          console.warn('[useNarrativeAvatar] Error caching community avatars:', cacheError);
        }
      }
      
      // Only log in development to reduce console noise in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useNarrativeAvatar] fetchCommunityAvatars - Mapped data being set:', 
          mappedData.length > 0 ? `${mappedData.length} items` : 'empty array');
      }
      
      setCommunityAvatars(mappedData);
      setIsInitialized(true); // Mark as initialized on success
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      
      // Check if this is an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[useNarrativeAvatar] Community avatars fetch timed out after 5 seconds');
      } else {
        console.error('Unexpected error fetching community avatars:', err);
      }
      
      // Always ensure we're initialized even on error
      setIsInitialized(true);
      
      // No more retries - they're causing too many long-running requests
      // We already loaded from cache at the beginning if available
    }
  }, []);
  
  const fetchCompanions = useCallback(async () => {
    // First check if we have local storage data - use as fallback immediately
    try {
      const cachedData = localStorage.getItem('companions_cache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useNarrativeAvatar] Using cached companions:', parsedData.length);
        }
        setCompanions(parsedData);
      }
    } catch (err) {
      console.warn('[useNarrativeAvatar] Error reading cached companions:', err);
    }
    
    // Create abort controller for proper timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000); // Reduced to 5-second timeout
    
    try {
      // First, check if table exists before attempting operations
      try {
        // Simple check query to verify if the table exists
        const { count, error: countError } = await supabase
          .from('Companion')
          .select('*', { count: 'exact', head: true })
          .limit(1)
          .abortSignal(abortController.signal);
          
        if (countError) {
          // Table likely doesn't exist, use empty data
          console.log('[useNarrativeAvatar] Companion table not available, using empty data');
          setCompanions([]);
          setIsInitialized(true);
          return;
        }
        
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[useNarrativeAvatar] Companion table exists with approximately ${count} rows`);
        }
      } catch (checkErr) {
        // If there's any error checking the table, continue with main query but log the error
        console.warn('[useNarrativeAvatar] Error checking Companion table:', checkErr);
      }
      
      // Only select the fields we need, limit to 20 results to improve query speed
      const { data, error } = await supabase
        .from('Companion')
        .select('UUID, companion, avatar_url, traits, speech_pattern, knowledge_domains, companion_type') 
        .limit(20) // Reduced limit for faster response
        .abortSignal(abortController.signal);
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);

      if (error) {
        // Silently ignore abort errors as they are expected on unmount or timeout
        if (error.name !== 'AbortError') {
          console.error('Error fetching companions:', error);
        }
        // We already set companions from cache, so just mark as initialized
        setIsInitialized(true);
        return;
      }

      const mappedData = data?.map((item: CompanionItem) => ({
        id: item.UUID || '', // Ensure ID is not null
        name: item.companion || '', // Use companion field for name
        role: 'companion' as const,
        avatar_url: item.avatar_url || '',
        traits: item.traits || '',
        speech_pattern: item.speech_pattern || '',
        knowledge_domains: item.knowledge_domains || '',
        companion_type: item.companion_type || ''
      })) || [];
      
      // Cache the data for future use
      if (mappedData.length > 0) {
        try {
          localStorage.setItem('companions_cache', JSON.stringify(mappedData));
        } catch (cacheError) {
          console.warn('[useNarrativeAvatar] Error caching companions:', cacheError);
        }
      }
      
      // Logging removed to reduce console noise
      
      setCompanions(mappedData);
      setIsInitialized(true); // Mark as initialized on success
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      
      // Check if this is an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[useNarrativeAvatar] Companions fetch timed out after 5 seconds');
      } else {
        console.error('Unexpected error fetching companions:', err);
      }
      
      // Always ensure we're initialized even on error
      setIsInitialized(true);
      
      // No more retries - they're causing too many long-running requests
      // We already loaded from cache at the beginning if available
    }
  }, []);

  useEffect(() => {
    fetchChurchAvatars();
    fetchCommunityAvatars();
    fetchCompanions();
  }, [fetchChurchAvatars, fetchCommunityAvatars, fetchCompanions]);

  // Global timeout to prevent app from hanging indefinitely
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[useNarrativeAvatar] Global timeout reached - forcing initialization with empty data');
        setChurchAvatars([]);
        setCommunityAvatars([]);
        setCompanions([]);
        setIsInitialized(true);
      }
    }, 20000); // 20-second global timeout

    return () => clearTimeout(globalTimeout);
  }, [isInitialized]);

  // Combine both avatar types into a single array
  useEffect(() => {
    const combinedAvatars: NarrativeAvatar[] = [
      ...churchAvatars.map(avatar => ({
        ...avatar,
        selected: churchAvatar?.id === avatar.id
      })),
      ...communityAvatars.map(avatar => ({
        ...avatar,
        selected: communityAvatar?.id === avatar.id
      }))
    ];
    
    setAllAvatars(combinedAvatars);
  }, [churchAvatars, communityAvatars, churchAvatar, communityAvatar]);

  // Helper to check if avatar is active
  const isAvatarActive = useCallback((id: string, role: string): boolean => {
    if (role === 'church' && churchAvatar?.id === id) {
      return true;
    }
    if (role === 'community' && communityAvatar?.id === id) {
      return true;
    }
    return false;
  }, [churchAvatar, communityAvatar]);

  // Helper to toggle avatar active state
  const toggleAvatar = useCallback((avatar: NarrativeAvatar) => {
    if (avatar.role === 'church') {
      selectChurchAvatar(churchAvatar?.id === avatar.id ? null : avatar as ChurchAvatar);
    }
    else if (avatar.role === 'community') {
      selectCommunityAvatar(communityAvatar?.id === avatar.id ? null : avatar as CommunityAvatar);
    }
  }, [churchAvatar, communityAvatar]);

  // Helper to find avatar by type and ID
  const getAvatarByType = useCallback((role: string, id: string): NarrativeAvatar | undefined => {
    if (role === 'church') {
      return churchAvatars.find(avatar => avatar.id === id);
    }
    if (role === 'community') {
      return communityAvatars.find(avatar => avatar.id === id);
    }
    return undefined;
  }, [churchAvatars, communityAvatars]);

  // Helper for default church avatar icon URL
  const getDefaultChurchIconUrl = useCallback(() => {
    return '/icons/church-icon.svg';
  }, []);

  // Helper for default community avatar icon URL
  const getDefaultCommunityIconUrl = useCallback(() => {
    return '/icons/community-icon.svg'; 
  }, []);

  const selectChurchAvatar = useCallback((avatar: ChurchAvatar | null) => {
    console.log('[useNarrativeAvatar] selectChurchAvatar CALLED. Avatar:', avatar, 'Current completedTasks in closure:', completedTasks);
    if (typeof setSelectedChurchAvatar !== 'function') { 
        console.error('[useNarrativeAvatar] setSelectedChurchAvatar is not a function in selectChurchAvatar!');
        return;
    }
    setSelectedChurchAvatar(avatar);
    
    if (avatar) {
      localStorage.setItem('selected_church_avatar', JSON.stringify(avatar));
      const updatedTasks = { ...completedTasks, church: true };
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    } else {
      localStorage.removeItem('selected_church_avatar');
    }
  }, [completedTasks]);

  const selectCommunityAvatar = useCallback((avatar: CommunityAvatar | null) => {
    console.log('[useNarrativeAvatar] selectCommunityAvatar CALLED. Avatar:', avatar, 'Current completedTasks in closure:', completedTasks);
    setSelectedCommunityAvatar(avatar);
    
    if (avatar) {
      localStorage.setItem('selected_community_avatar', JSON.stringify(avatar));
      const updatedTasks = { ...completedTasks, community: true };
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    } else {
      localStorage.removeItem('selected_community_avatar');
    }
  }, [completedTasks]);

  const selectCompanion = useCallback((companionId: string | null) => {
    setSelectedCompanionId(companionId);
    
    if (companionId) {
      localStorage.setItem('selected_companion_id', companionId);
    } else {
      localStorage.removeItem('selected_companion_id');
    }
  }, []);

  const clearSelectedAvatars = useCallback(() => {
    selectChurchAvatar(null);
    selectCommunityAvatar(null);
    selectCompanion(null);
    
    // Also clear task completion status
    const resetTasks = { church: false, community: false };
    setCompletedTasks(resetTasks);
    localStorage.setItem('completed_tasks', JSON.stringify(resetTasks));
  }, [selectChurchAvatar, selectCommunityAvatar, selectCompanion]);

  const saveChurchAvatar = useCallback(async (avatarData: Partial<ChurchAvatar>) => {
    try {
      const { data, error } = await supabase
        .from('church_avatars')
        .insert([avatarData])
        .select();
      
      if (error) {
        console.error('Error saving church avatar:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (err) {
      console.error('Unexpected error saving church avatar:', err);
      return null;
    }
  }, []);

  const saveCommunityAvatar = useCallback(async (avatarData: Partial<CommunityAvatar>) => {
    try {
      const { data, error } = await supabase
        .from('community_avatars')
        .insert([avatarData])
        .select();
      
      if (error) {
        console.error('Error saving community avatar:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (err) {
      console.error('Unexpected error saving community avatar:', err);
      return null;
    }
  }, []);

  const markTaskComplete = useCallback((task: keyof CompletedTasks) => {
    const updatedTasks = { ...completedTasks, [task]: true };
    setCompletedTasks(updatedTasks);
    localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
  }, [completedTasks]);

  const unlockTask = useCallback((task: keyof CompletedTasks) => {
    const updatedTasks = { ...completedTasks, [task]: false };
    setCompletedTasks(updatedTasks);
    localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
  }, [completedTasks]);

  return {
    avatars: allAvatars,
    churchAvatars,
    communityAvatars,
    companions,
    churchAvatar,
    communityAvatar,
    completedTasks,
    setCompletedTasks,
    selectCommunityAvatar,
    selectChurchAvatar, 
    selectCompanion,
    saveChurchAvatar,
    saveCommunityAvatar,
    clearSelectedAvatars,
    markTaskComplete,
    unlockTask,
    selectedCompanionId,
    setSelectedCompanionId,
    getDefaultChurchIconUrl,
    getDefaultCommunityIconUrl,
    isAvatarActive,
    toggleAvatar,
    getAvatarByType,
    isInitialized
  };
}
