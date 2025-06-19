import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';

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
  companion: boolean;
  narrative: boolean;
}

interface SaveAvatarResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type AvatarType = 'church' | 'community' | 'companion';

export function useNarrativeAvatar() {
  const [selectedChurchAvatar, setSelectedChurchAvatar] = useState<ChurchAvatar | null>(null);
  const [selectedCommunityAvatar, setSelectedCommunityAvatar] = useState<CommunityAvatar | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [selectedNarrativeAvatar, _setSelectedNarrativeAvatar] = useState<NarrativeAvatar | null>(null); // Mark as unused
  const [churchAvatars, setChurchAvatars] = useState<ChurchAvatar[]>([]);
  const [communityAvatars, setCommunityAvatars] = useState<CommunityAvatar[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({
    church: false,
    community: false,
    companion: false,
    narrative: false
  });

  useEffect(() => {
    const loadStoredSelections = () => {
      try {
        const storedChurchAvatar = localStorage.getItem('selected_church_avatar');
        if (storedChurchAvatar) {
          const parsedAvatar = JSON.parse(storedChurchAvatar);
          setSelectedChurchAvatar(parsedAvatar);
        }
        
        const storedCommunityAvatar = localStorage.getItem('selected_community_avatar');
        if (storedCommunityAvatar) {
          const parsedAvatar = JSON.parse(storedCommunityAvatar);
          setSelectedCommunityAvatar(parsedAvatar);
        }

        const storedCompanion = localStorage.getItem('selected_companion');
        if (storedCompanion) {
          const parsedCompanion = JSON.parse(storedCompanion);
          setSelectedCompanion(parsedCompanion);
        }
        
        const storedTasks = localStorage.getItem('completed_tasks');
        if (storedTasks) {
          try {
            const parsedTasks = JSON.parse(storedTasks);
            if (Array.isArray(parsedTasks)) {
              const tasksObject: CompletedTasks = {
                church: parsedTasks.includes('select_church_avatar'),
                community: parsedTasks.includes('select_community_avatar'),
                companion: parsedTasks.includes('select_companion'),
                narrative: parsedTasks.includes('complete_narrative')
              };
              setCompletedTasks(tasksObject);
            } else {
              setCompletedTasks(parsedTasks);
            }
          } catch (e) {
            console.error('Failed to parse stored tasks:', e);
          }
        }
      } catch (e) {
        console.error('Error loading stored avatar selections:', e);
      }
    };
    
    loadStoredSelections();
  }, []);

  const fetchChurchAvatars = useCallback(async () => {
    try {
      // Add a timeout promise to catch network issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });
      
      // Create the Supabase query
      const fetchPromise = supabase
        .from('church_avatars')
        .select('*')
        .order('created_at', { ascending: true });
      
      // Race the timeout against the actual fetch
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('Fetch church avatars request timed out');
        })
      ]);

      if (error) {
        console.error('Error fetching church avatars:', error);
        // Handle specific types of errors
        if (error.message.includes('NetworkError')) {
          console.warn('[useNarrativeAvatar] Network error detected when fetching church avatars.');
        }
        return;
      }

      const mappedData = data?.map(item => ({
        id: item.id,
        name: item.avatar_name || '',
        role: 'church',
        image_url: item.image_url || '',
        description: item.avatar_point_of_view || '',
        avatar_name: item.avatar_name || '',
        avatar_point_of_view: item.avatar_point_of_view || '',
        avatar_structured_data: item.avatar_structured_data
      })) || [];
      
      console.log('[useNarrativeAvatar] fetchChurchAvatars - Mapped data being set:', mappedData.map(a => ({ id: a.id, name: a.name })));
      setChurchAvatars(mappedData);
    } catch (err) {
      console.error('Unexpected error fetching church avatars:', err);
      // Add retry logic
      if (typeof window !== 'undefined') {
        const retryCount = Number(localStorage.getItem('church_avatars_fetch_retry') || '0');
        if (retryCount < 3) {
          localStorage.setItem('church_avatars_fetch_retry', String(retryCount + 1));
          console.log(`[useNarrativeAvatar] Scheduling church avatars retry #${retryCount + 1} in 3 seconds...`);
          setTimeout(fetchChurchAvatars, 3000);
        } else {
          console.warn('[useNarrativeAvatar] Maximum fetch retries reached for church avatars');
          localStorage.removeItem('church_avatars_fetch_retry');
        }
      }
    }
  }, []);

  const fetchCommunityAvatars = useCallback(async () => {
    try {
      // Add a timeout promise to catch network issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });
      
      // Create the Supabase query
      const fetchPromise = supabase
        .from('community_avatars')
        .select('*')
        .order('created_at', { ascending: true });
      
      // Race the timeout against the actual fetch
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('Fetch community avatars request timed out');
        })
      ]);

      if (error) {
        console.error('Error fetching community avatars:', error);
        // Handle specific types of errors
        if (error.message.includes('NetworkError')) {
          console.warn('[useNarrativeAvatar] Network error detected when fetching community avatars.');
        }
        return;
      }

      const mappedData = data?.map(item => ({
        id: item.id,
        name: item.avatar_name || '',
        role: 'community',
        image_url: item.image_url || '',
        description: item.avatar_point_of_view || '',
        avatar_name: item.avatar_name || '',
        avatar_point_of_view: item.avatar_point_of_view || '',
        avatar_structured_data: item.avatar_structured_data
      })) || [];
      
      console.log('[useNarrativeAvatar] fetchCommunityAvatars - Mapped data being set:', mappedData.map(a => ({ id: a.id, name: a.name })));
      setCommunityAvatars(mappedData);
    } catch (err) {
      console.error('Unexpected error fetching community avatars:', err);
      // Add retry logic
      if (typeof window !== 'undefined') {
        const retryCount = Number(localStorage.getItem('community_avatars_fetch_retry') || '0');
        if (retryCount < 3) {
          localStorage.setItem('community_avatars_fetch_retry', String(retryCount + 1));
          console.log(`[useNarrativeAvatar] Scheduling community avatars retry #${retryCount + 1} in 3 seconds...`);
          setTimeout(fetchCommunityAvatars, 3000);
        } else {
          console.warn('[useNarrativeAvatar] Maximum fetch retries reached for community avatars');
          localStorage.removeItem('community_avatars_fetch_retry');
        }
      }
    }
  }, []);

  const fetchCompanions = useCallback(async () => {
    try {
      // Add a timeout promise to catch network issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 second timeout
      });
      
      // Create the Supabase query promise
      const fetchPromise = supabase.from('Companion').select('*');
      
      // Race the timeout against the actual fetch
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('Fetch companions request timed out');
        })
      ]);
      
      if (error) {
        console.error('Error fetching companions:', error);
        // Log more details about the error for debugging
        if (error.message.includes('NetworkError')) {
          console.warn('[useNarrativeAvatar] Network error detected. This could be due to connectivity issues.');
        }
        setCompanions([]); // Set to empty array on error
        return;
      }

      console.log('[useNarrativeAvatar] fetchCompanions - Raw data from Supabase:', data);
      const mappedData = data?.map(item => ({
        id: item.UUID, // Corrected: Use UUID from Supabase table
        name: item.companion || '', // Corrected: Use companion field for name
        role: 'companion' as const,
        avatar_url: item.avatar_url || '',
        traits: item.traits || '',
        speech_pattern: item.speech_pattern || '',
        knowledge_domains: item.knowledge_domains || '',
        companion_type: item.companion_type || ''
      })) || [];
      
      console.log('[useNarrativeAvatar] fetchCompanions - Mapped data being set (check IDs here):', mappedData.map(c => ({ id: c.id, name: c.name })));
      setCompanions(mappedData);
    } catch (err) {
      console.error('Unexpected error fetching companions:', err);
      // Add retry logic
      if (typeof window !== 'undefined') {
        // If we haven't retried too many times, try again after a delay
        const retryCount = Number(localStorage.getItem('companions_fetch_retry') || '0');
        if (retryCount < 3) {
          localStorage.setItem('companions_fetch_retry', String(retryCount + 1));
          console.log(`[useNarrativeAvatar] Scheduling retry #${retryCount + 1} in 3 seconds...`);
          setTimeout(fetchCompanions, 3000);
        } else {
          console.warn('[useNarrativeAvatar] Maximum fetch retries reached for companions');
          localStorage.removeItem('companions_fetch_retry'); // Reset for next session
        }
      }
      setCompanions([]); // Set to empty array on unexpected error
    }
  }, []);

  useEffect(() => {
    fetchChurchAvatars();
    fetchCommunityAvatars();
    fetchCompanions(); // Ensure this function is defined above and correctly named
  }, [fetchChurchAvatars, fetchCommunityAvatars, fetchCompanions]);

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
      console.log('[useNarrativeAvatar] selectChurchAvatar: Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    } else {
      localStorage.removeItem('selected_church_avatar');
      const updatedTasks = { ...completedTasks, church: false };
      console.log('[useNarrativeAvatar] selectChurchAvatar (removing): Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    }
  }, [completedTasks, setSelectedChurchAvatar]);

  const selectCommunityAvatar = useCallback((avatar: CommunityAvatar | null) => {
    console.log('[useNarrativeAvatar] selectCommunityAvatar CALLED. Avatar:', avatar, 'Current completedTasks in closure:', completedTasks);
    if (typeof setSelectedCommunityAvatar !== 'function') { 
        console.error('[useNarrativeAvatar] setSelectedCommunityAvatar is not a function in selectCommunityAvatar!');
        return;
    }
    setSelectedCommunityAvatar(avatar);
    
    if (avatar) {
      localStorage.setItem('selected_community_avatar', JSON.stringify(avatar));
      const updatedTasks = { ...completedTasks, community: true };
      console.log('[useNarrativeAvatar] selectCommunityAvatar: Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    } else {
      localStorage.removeItem('selected_community_avatar');
      const updatedTasks = { ...completedTasks, community: false };
      console.log('[useNarrativeAvatar] selectCommunityAvatar (removing): Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    }
  }, [completedTasks, setSelectedCommunityAvatar]);

  const selectCompanion = useCallback((companion: Companion | null) => {
    console.log('[useNarrativeAvatar] selectCompanion CALLED. Companion:', companion, 'Current completedTasks in closure:', completedTasks);
    if (typeof setSelectedCompanion !== 'function') { 
        console.error('[useNarrativeAvatar] setSelectedCompanion is not a function in selectCompanion!');
        return;
    }
    setSelectedCompanion(companion);
    
    if (companion) {
      localStorage.setItem('selected_companion', JSON.stringify(companion));
      const updatedTasks = { ...completedTasks, companion: true };
      console.log('[useNarrativeAvatar] selectCompanion: Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    } else {
      localStorage.removeItem('selected_companion');
      const updatedTasks = { ...completedTasks, companion: false };
      console.log('[useNarrativeAvatar] selectCompanion (removing): Updating completedTasks from', completedTasks, 'to', updatedTasks);
      setCompletedTasks(updatedTasks);
      localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
    }
  }, [completedTasks, setSelectedCompanion]);
  
  const saveChurchAvatar = useCallback(async (avatarData: { 
    avatar_name: string; 
    avatar_point_of_view: string;
    avatar_structured_data?: string | null; 
    image_url?: string;
  }): Promise<SaveAvatarResult> => {
    try {
      const { data, error } = await supabase
        .from('church_avatars')
        .insert([avatarData])
        .select();
      
      if (error) {
        console.error('Error saving church avatar:', error);
        return { success: false, error: error.message };
      }
      
      if (data && data[0]) {
        const newAvatar = {
          id: data[0].id,
          name: data[0].avatar_name,
          role: 'church',
          image_url: data[0].image_url,
          description: data[0].avatar_point_of_view,
          avatar_name: data[0].avatar_name,
          avatar_point_of_view: data[0].avatar_point_of_view,
          avatar_structured_data: data[0].avatar_structured_data
        };
        
        await fetchChurchAvatars();
        return { success: true, data: newAvatar };
      }
      
      return { success: false, error: 'No data returned' };
    } catch (error: any) {
      console.error('Unexpected error saving church avatar:', error);
      return { success: false, error: error.message };
    }
  }, [fetchChurchAvatars]);
  
  const saveCommunityAvatar = useCallback(async (avatarData: { 
    avatar_name: string; 
    avatar_point_of_view: string;
    avatar_structured_data?: string | null; 
    image_url?: string;
  }): Promise<SaveAvatarResult> => {
    try {
      const { data, error } = await supabase
        .from('community_avatars')
        .insert([avatarData])
        .select();
      
      if (error) {
        console.error('Error saving community avatar:', error);
        return { success: false, error: error.message };
      }
      
      if (data && data[0]) {
        const newAvatar = {
          id: data[0].id,
          name: data[0].avatar_name,
          role: 'community',
          image_url: data[0].image_url,
          description: data[0].avatar_point_of_view,
          avatar_name: data[0].avatar_name,
          avatar_point_of_view: data[0].avatar_point_of_view,
          avatar_structured_data: data[0].avatar_structured_data
        };
        
        await fetchCommunityAvatars();
        return { success: true, data: newAvatar };
      }
      
      return { success: false, error: 'No data returned' };
    } catch (error: any) {
      console.error('Unexpected error saving community avatar:', error);
      return { success: false, error: error.message };
    }
  }, [fetchCommunityAvatars]);

  const clearSelectedAvatars = useCallback(() => {
    setSelectedChurchAvatar(null);
    setSelectedCommunityAvatar(null);
    localStorage.removeItem('selected_church_avatar');
    localStorage.removeItem('selected_community_avatar');
    
    const updatedTasks = { ...completedTasks, church: false, community: false };
    setCompletedTasks(updatedTasks);
    localStorage.setItem('completed_tasks', JSON.stringify(updatedTasks));
  }, [completedTasks]);
  
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

  const getDefaultChurchIconUrl = useCallback(() => {
    return "https://i.imgur.com/HkbfIJo.png";
  }, []);

  const getDefaultCommunityIconUrl = useCallback(() => {
    return "https://i.imgur.com/pAZvwn3.png";
  }, []);

  const getAvatarByType = useCallback((type: AvatarType) => {
    switch (type) {
      case 'church':
        return selectedChurchAvatar;
      case 'community':
        return selectedCommunityAvatar;
      default:
        return null;
    }
  }, [selectedChurchAvatar, selectedCommunityAvatar]);

  const isAvatarActive = useCallback((type: AvatarType): boolean => {
    return Boolean(getAvatarByType(type));
  }, [getAvatarByType]);

  const toggleAvatar = useCallback((type: AvatarType): void => {
    switch (type) {
      case 'church':
        break;
      case 'community':
        break;
      default:
        break;
    }
  }, []);

  // TODO: Implement saveCompanion, isLoading, and error handling if needed

  return {
    selectedChurchAvatar,
    selectedCommunityAvatar,
    selectedNarrativeAvatar, // This is _setSelectedNarrativeAvatar, consider if selectedNarrativeAvatar state is needed
    selectedCompanion,
    churchAvatars,
    communityAvatars,
    companions,
    completedTasks,
    setCompletedTasks, // Make sure this is intended to be exported and used
    // isLoading, // Not yet implemented
    // error, // Not yet implemented
    fetchChurchAvatars,
    fetchCommunityAvatars,
    fetchCompanions,
    selectChurchAvatar,
    selectCommunityAvatar,
    selectCompanion,
    saveChurchAvatar,
    saveCommunityAvatar,
    // saveCompanion, // Not yet implemented
    clearSelectedAvatars,
    markTaskComplete,
    unlockTask,
    getDefaultChurchIconUrl,
    getDefaultCommunityIconUrl,
    isAvatarActive,
    toggleAvatar,
    getAvatarByType
  };
}
