import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';

const PARISH_COMPANION_STORAGE_KEY = 'selected_parish_companion';

export interface ParishCompanion {
  id: string;
  name: string;
  avatar_url?: string;
  traits?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
  role: 'parish_companion';
}

interface ParishCompanionStore {
  selectedParishCompanion: ParishCompanion | null;
  companions: ParishCompanion[];
  loading: boolean;
  error: string | null;
  selectCompanion: (companion: ParishCompanion) => void;
  fetchCompanions: () => Promise<void>;
  clearSelectedCompanion: () => void;
  hasSelectedCompanion: () => boolean;
}

// Get stored companion from localStorage
const getStoredParishCompanion = (): ParishCompanion | null => {
  try {
    const storedCompanion = localStorage.getItem(PARISH_COMPANION_STORAGE_KEY);
    if (storedCompanion) {
      const parsedCompanion = JSON.parse(storedCompanion);
      console.log('[useParishCompanion] Loaded companion from storage:', parsedCompanion.name);
      return parsedCompanion as ParishCompanion;
    }
    console.log('[useParishCompanion] No companion found in storage');
    return null;
  } catch (error) {
    console.error('[useParishCompanion] Error loading companion from storage:', error);
    return null;
  }
};

export function useParishCompanion(): ParishCompanionStore {
  const [selectedParishCompanion, setSelectedParishCompanion] = useState<ParishCompanion | null>(getStoredParishCompanion());
  const [companions, setCompanions] = useState<ParishCompanion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectCompanion = useCallback((companion: ParishCompanion) => {
    console.log('[useParishCompanion] Setting companion:', companion.name);
    setSelectedParishCompanion(companion);
    localStorage.setItem(PARISH_COMPANION_STORAGE_KEY, JSON.stringify(companion));
  }, []);

  const clearSelectedCompanion = useCallback(() => {
    console.log('[useParishCompanion] Clearing selected companion');
    setSelectedParishCompanion(null);
    localStorage.removeItem(PARISH_COMPANION_STORAGE_KEY);
  }, []);

  const hasSelectedCompanion = useCallback(() => {
    return selectedParishCompanion !== null;
  }, [selectedParishCompanion]);

  const fetchCompanions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a timeout promise to catch network issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 second timeout
      });
      
      // Create the Supabase query promise
      const fetchPromise = supabase.from('Companion_parish').select('*');
      
      // Race the timeout against the actual fetch
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('Fetch parish companions request timed out');
        })
      ]);
      
      if (error) {
        console.error('Error fetching parish companions:', error);
        setError(`Failed to fetch parish companions: ${error.message}`);
        setCompanions([]); 
        return;
      }

      console.log('[useParishCompanion] fetchCompanions - Raw data from Supabase:', data);
      const mappedData = data?.map(item => ({
        id: item.UUID || item.id, // Support different ID field names
        name: item.companion || '', 
        role: 'parish_companion' as const,
        avatar_url: item.avatar_url || '',
        traits: item.traits || '',
        speech_pattern: item.speech_pattern || '',
        knowledge_domains: item.knowledge_domains || '',
        companion_type: item.companion_type || ''
      })) || [];
      
      console.log('[useParishCompanion] fetchCompanions - Mapped data:', mappedData);
      setCompanions(mappedData);
    } catch (err) {
      console.error('Unexpected error fetching parish companions:', err);
      setError('An unexpected error occurred while fetching parish companions');
      
      // Add retry logic
      if (typeof window !== 'undefined') {
        const retryCount = Number(localStorage.getItem('parish_companions_fetch_retry') || '0');
        if (retryCount < 3) {
          localStorage.setItem('parish_companions_fetch_retry', String(retryCount + 1));
          console.log(`[useParishCompanion] Scheduling retry #${retryCount + 1} in 3 seconds...`);
          setTimeout(fetchCompanions, 3000);
        } else {
          console.warn('[useParishCompanion] Maximum fetch retries reached for parish companions');
          localStorage.removeItem('parish_companions_fetch_retry');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load companions data on mount
  useEffect(() => {
    fetchCompanions();
  }, [fetchCompanions]);

  return {
    selectedParishCompanion,
    companions,
    loading,
    error,
    selectCompanion,
    fetchCompanions,
    clearSelectedCompanion,
    hasSelectedCompanion
  };
}
