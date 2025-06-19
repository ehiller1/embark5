import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/lib/supabase';

interface ResourceContent {
  id: string;
  title: string;
  content: string;
  resource_type: string;
  church_id: string;
  created_at: string;
  updated_at: string;
}

interface GroupedResources {
  discernment_plan?: ResourceContent;
  research_summary?: ResourceContent;
  vocational_statement?: ResourceContent;
  scenario_details?: ResourceContent;
}

type ResourceType = 'discernment_plan' | 'research_summary' | 'vocational_statement' | 'scenario_details';

export const useResourceContent = () => {
  const [resources, setResources] = useState<GroupedResources>({});
  const [allResources, setAllResources] = useState<ResourceContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        // Get the active user's church_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Try to get user's church_id from user_metadata first
        let churchId = user.user_metadata?.church_id;
        
        // If not in metadata, try alternate tables or methods
        if (!churchId) {
          try {
            // Try to get from profiles table if it exists
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('church_id')
              .eq('id', user.id)
              .single();
            
            if (!profileError && profileData?.church_id) {
              churchId = profileData.church_id;
            }
          } catch (err) {
            console.warn('Could not retrieve church_id from profiles table:', err);
            // Continue without throwing - we'll try to fetch resources without church_id filter
          }
        }
        
        // Fetch all resource types for this church if we have a churchId,
        // otherwise fetch all available resources
        let query = supabase
          .from('resource_library')
          .select('id, title, content, resource_type, church_id, created_at, updated_at');
        
        // Only filter by church_id if we have one
        if (churchId) {
          query = query.eq('church_id', churchId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setAllResources(data || []);
        
        // Group resources by type and keep only the most recent of each type
        const resourceTypes: ResourceType[] = ['discernment_plan', 'research_summary', 'vocational_statement', 'scenario_details'];
        const grouped: GroupedResources = {};
        
        resourceTypes.forEach(type => {
          const typeResources = data?.filter(r => r.resource_type === type) || [];
          if (typeResources.length > 0) {
            // Most recent will be first due to descending order
            grouped[type] = typeResources[0] as ResourceContent;
          }
        });
        
        setResources(grouped);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return { resources, allResources, loading, error };
};

// Legacy support for backward compatibility
export const useDiscernmentPlanContent = () => {
  const { allResources, loading, error } = useResourceContent();
  return { 
    plans: allResources.filter(r => r.resource_type === 'discernment_plan'), 
    loading, 
    error 
  };
};
