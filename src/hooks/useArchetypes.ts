import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/lib/supabase";
import { useToast } from './use-toast';

export interface Archetype {
  id: string;
  name: string;
  description: string;
  type: string;
  attributes: Record<string, any>;
  created_at: string;
}

export function useArchetypes() {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchArchetypes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('archetypes')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setArchetypes(data || []);
    } catch (error) {
      console.error('Error fetching archetypes:', error);
      toast({
        title: 'Error loading archetypes',
        description: 'Could not load archetypes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchetypes();
  }, []);

  return { archetypes, isLoading, fetchArchetypes };
}
