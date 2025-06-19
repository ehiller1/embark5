import { create } from 'zustand';
import { supabase } from '@/integrations/lib/supabase';
import { useEffect, useRef } from 'react';
import { storageUtils } from '@/utils/storage';

const COMPANION_STORAGE_KEY = 'selected_companion';

export interface Companion {
  UUID: number;
  companion: string;
  companion_type: string;
  traits: string;
  speech_pattern: string;
  knowledge_domains: string;
  avatar_url?: string;
}

interface CompanionStore {
  selectedCompanion: Companion | null;
  refreshKey: string;
  selectCompanion: (companion: Companion) => void;
  clearSelectedCompanion: () => void;
  hasSelectedCompanion: () => boolean;
  allCompanions: Companion[];
  setAllCompanions: (companions: Companion[]) => void;
  companionChanged: boolean;
  setCompanionChanged: (changed: boolean) => void;
  resetCompanionChanged: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  refreshCompanions: () => void;
  fetchCompanions: () => Promise<void>;
}

// Get stored companion from localStorage
// Get stored companion from localStorage, handling potential legacy format
const getStoredCompanion = (): Companion | null => {
  try {
    const storedItem = storageUtils.getItem<any>(COMPANION_STORAGE_KEY, null);
    
    if (storedItem) {
      // Check if it's the old format (id/name) or new format (UUID/companion)
      if (typeof storedItem.id === 'number' && typeof storedItem.name === 'string' && storedItem.UUID === undefined && storedItem.companion === undefined) {
        // Old format detected, transform it
        const transformedCompanion: Companion = {
          UUID: storedItem.id,
          companion: storedItem.name,
          companion_type: storedItem.companion_type || '',
          traits: storedItem.traits || '',
          speech_pattern: storedItem.speech_pattern || '',
          knowledge_domains: storedItem.knowledge_domains || '',
          avatar_url: storedItem.avatar_url,
        };
        console.log('[useSelectedCompanion] Loaded and transformed legacy companion from storage:', transformedCompanion.companion);
        return transformedCompanion;
      } else if (typeof storedItem.UUID === 'number' && typeof storedItem.companion === 'string'){
        // Already in new/correct format
        console.log('[useSelectedCompanion] Loaded companion from storage (new format):', storedItem.companion);
        return storedItem as Companion;
      } else {
        console.warn('[useSelectedCompanion] Companion in storage has unexpected format:', storedItem);
        storageUtils.removeItem(COMPANION_STORAGE_KEY); // Clear invalid item
        return null;
      }
    } else {
      console.log('[useSelectedCompanion] No companion found in storage');
      return null;
    }
  } catch (error) {
    console.error('[useSelectedCompanion] Error loading companion from storage:', error);
    return null;
  }
};

export const useSelectedCompanion = create<CompanionStore>((set, get) => ({
  selectedCompanion: getStoredCompanion(), // Initialize from localStorage
  refreshKey: 'initial',
  allCompanions: [],
  companionChanged: false,
  loading: false,
  error: null,
  selectCompanion: (companion: Companion) => {
    // Don't update if the same companion is already selected
    const currentCompanion = get().selectedCompanion;
    // Ensure the incoming companion object matches the Companion interface
    if (!companion || typeof companion.UUID !== 'number' || typeof companion.companion !== 'string') {
      console.error('[useSelectedCompanion] selectCompanion called with invalid companion object:', companion);
      return;
    }

    if (currentCompanion && currentCompanion.UUID === companion.UUID && currentCompanion.companion === companion.companion) {
      console.log('[useSelectedCompanion] Same companion already selected:', companion.companion);
      return;
    }
    
    console.log('[useSelectedCompanion] Setting companion:', companion.companion);
    set({ 
      selectedCompanion: companion,
      refreshKey: Math.random().toString(36).substring(7),
      companionChanged: true
    });
    
    // Save to localStorage
    try {
      storageUtils.setItem(COMPANION_STORAGE_KEY, companion);
      console.log('[useSelectedCompanion] Companion saved to storage:', companion.companion);
    } catch (error) {
      console.error('[useSelectedCompanion] Error saving companion to storage:', error);
    }
  },
  clearSelectedCompanion: () => {
    console.log('[useSelectedCompanion] Clearing selected companion');
    set({ selectedCompanion: null });
    storageUtils.removeItem(COMPANION_STORAGE_KEY);
  },
  hasSelectedCompanion: () => get().selectedCompanion !== null,
  setAllCompanions: (companions) => set({ allCompanions: companions }),
  setCompanionChanged: (changed) => set({ companionChanged: changed }),
  resetCompanionChanged: () => set({ companionChanged: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  refreshCompanions: () => {
    console.log('[useSelectedCompanion] Refreshing companions');
    set(() => ({
      refreshKey: Math.random().toString(36).substring(7),
      loading: true,
      error: null
    }));
  },
  fetchCompanions: async () => {
    console.log('[useSelectedCompanion] Fetching companions');
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('Companion')
        .select('*');
        
      if (error) {
        console.error('[useSelectedCompanion] Error fetching companions:', error);
        set({ 
          error: `Failed to load companions: ${error.message}`, 
          loading: false 
        });
        return;
      }

      console.log('[useSelectedCompanion] Fetched companions from Supabase:', data?.length || 0);
      // Ensure fetched data conforms to Companion interface
      const validCompanions = (data || []).filter(
        item => typeof item.UUID === 'number' && typeof item.companion === 'string'
      ) as Companion[];
      if (validCompanions.length !== (data?.length || 0)) {
        console.warn('[useSelectedCompanion] Some companions fetched from Supabase had an unexpected format.');
      }
      set({ 
        allCompanions: validCompanions, 
        loading: false,
        error: null
      });
      
      // If there's no selected companion but we have companions, select the first one
      const currentSelected = get().selectedCompanion;
      if (!currentSelected && data && data.length > 0) {
        const defaultCompanionFromDB = data[0]; // This is from Supabase
        if (defaultCompanionFromDB && typeof defaultCompanionFromDB.UUID === 'number' && typeof defaultCompanionFromDB.companion === 'string') {
          console.log('[useSelectedCompanion] Auto-selecting first companion:', defaultCompanionFromDB.companion);
          get().selectCompanion(defaultCompanionFromDB as Companion);
        } else {
          console.warn('[useSelectedCompanion] Default companion from DB has unexpected format:', defaultCompanionFromDB);
        }
      }
      // If there's a selected companion, update it with fresh data only if it changed
      else if (currentSelected && data) {
        const updatedSelectedFromDB = data.find(c => c.UUID === currentSelected.UUID); // c is from Supabase
        if (updatedSelectedFromDB && typeof updatedSelectedFromDB.UUID === 'number' && typeof updatedSelectedFromDB.companion === 'string') {
          const typedUpdatedSelected = updatedSelectedFromDB as Companion;
          // Only update if the data actually changed
          const hasChanged = Object.keys(typedUpdatedSelected).some(key => 
            typedUpdatedSelected[key as keyof Companion] !== currentSelected[key as keyof Companion]
          );
          
          if (hasChanged) {
            console.log('[useSelectedCompanion] Updating selected companion with fresh data:', typedUpdatedSelected.companion);
            set({ selectedCompanion: typedUpdatedSelected });
            storageUtils.setItem(COMPANION_STORAGE_KEY, typedUpdatedSelected);
          } else {
            console.log('[useSelectedCompanion] Selected companion data unchanged, skipping update');
          }
        } else if (updatedSelectedFromDB) {
            console.warn('[useSelectedCompanion] Updated selected companion from DB has unexpected format:', updatedSelectedFromDB);
        }
      }
    } catch (err) {
      console.error('[useSelectedCompanion] Unexpected error:', err);
      set({ 
        error: 'An unexpected error occurred while fetching companions', 
        loading: false 
      });
    }
  }
}));

// Subscriber hook that listens for refresh key changes and triggers data fetching
export const useCompanionSubscriber = () => {
  const { refreshKey, fetchCompanions } = useSelectedCompanion();
  const lastFetchTime = useRef<number>(0);
  const DEBOUNCE_TIME = 5000; // 5 seconds
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchTime.current < DEBOUNCE_TIME) {
      console.log('[useCompanionSubscriber] Skipping fetch due to debounce');
      return;
    }
    
    lastFetchTime.current = now;
    console.log('[useCompanionSubscriber] Fetching companions...');
    fetchCompanions();
  }, [refreshKey, fetchCompanions]);
  
  return null;
};
