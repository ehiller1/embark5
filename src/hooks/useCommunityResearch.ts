
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { toast } from '@/hooks/use-toast';

export const useCommunityResearch = () => {
  const [communityNotes, setCommunityNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityResearch();
  }, []);

  const fetchCommunityResearch = async () => {
    try {
      const { data, error } = await supabase
        .from('community_research')
        .select('notes')
        .maybeSingle();

      if (error) throw error;
      setCommunityNotes(data?.notes || null);
    } catch (error) {
      console.error('Error fetching community research:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch community research data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommunityNotes = async (notes: string) => {
    try {
      const { error } = await supabase
        .from('community_research')
        .upsert({ 
          notes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setCommunityNotes(notes);
      
      toast({
        title: 'Success',
        description: 'Community research notes updated',
      });
    } catch (error) {
      console.error('Error updating community research:', error);
      toast({
        title: 'Error',
        description: 'Failed to update community research notes',
        variant: 'destructive',
      });
    }
  };

  return {
    communityNotes,
    loading,
    updateCommunityNotes
  };
};
