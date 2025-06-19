import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';

export interface SectionAvatar {
  id: string;
  name: string;
  description: string;
  initial_message?: string;
  page: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export const useSectionAvatars = () => {
  const [sectionAvatars, setSectionAvatars] = useState<SectionAvatar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchSectionAvatars = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('section_avatars')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setSectionAvatars(data || []);
    } catch (err) {
      console.error('Error fetching section avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch section avatars');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSectionAvatars = useCallback(async () => {
    await fetchSectionAvatars();
  }, [fetchSectionAvatars]);

  useEffect(() => {
    fetchSectionAvatars();
  }, [fetchSectionAvatars]);

  const getAvatarForPage = useCallback((page: string): SectionAvatar | undefined => {
    return sectionAvatars.find(avatar => avatar.page === page);
  }, [sectionAvatars]);

  return {
    sectionAvatars,
    loading,
    error,
    fetchSectionAvatars,
    refreshSectionAvatars,
    getAvatarForPage
  };
};
