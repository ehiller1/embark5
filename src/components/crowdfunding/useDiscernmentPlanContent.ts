
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/lib/supabase';

interface DiscernmentPlanContent {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useDiscernmentPlanContent = () => {
  const [plans, setPlans] = useState<DiscernmentPlanContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscernmentPlans = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resource_library')
          .select('id, title, content, created_at, updated_at')
          .eq('resource_type', 'discernment_plan')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPlans(data || []);
      } catch (err) {
        console.error('Error fetching discernment plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch discernment plans');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscernmentPlans();
  }, []);

  return { plans, loading, error };
};
