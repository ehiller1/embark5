import { useState, useEffect } from 'react';
import { NetworkConnection } from '@/types/NetworkTypes';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { generateSampleNetworkData, cleanupDuplicateNetworkData } from '@/utils/networkDataService';

export function useNetworkConnections() {
  const [networkData, setNetworkData] = useState<NetworkConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserRole();

  useEffect(() => {
    async function fetchNetworkConnections() {
      if (!user || !user.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await cleanupDuplicateNetworkData(user.id);

        const { data, error } = await supabase
          .from('network_connections')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        const reFetchWithSampleData = async () => {
          console.log('[useNetworkConnections] Generating sample data.');
          await generateSampleNetworkData(user.id);
          const { data: refreshedData, error: refreshError } = await supabase
            .from('network_connections')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (refreshError) throw refreshError;

          if (refreshedData && refreshedData.length > 0) {
            const typedRefreshedData = {
              ...refreshedData[0],
              church_similarity_data: refreshedData[0].church_similarity_data as unknown as NetworkConnection['church_similarity_data'],
              community_similarity_data: refreshedData[0].community_similarity_data as unknown as NetworkConnection['community_similarity_data'],
              plan_similarity_data: refreshedData[0].plan_similarity_data as unknown as NetworkConnection['plan_similarity_data'],
            } as NetworkConnection;
            setNetworkData(typedRefreshedData);
          }
        };

        if (data && data.length > 0) {
          const typedData = {
            ...data[0],
            church_similarity_data: data[0].church_similarity_data as unknown as NetworkConnection['church_similarity_data'],
            community_similarity_data: data[0].community_similarity_data as unknown as NetworkConnection['community_similarity_data'],
            plan_similarity_data: data[0].plan_similarity_data as unknown as NetworkConnection['plan_similarity_data'],
          } as NetworkConnection;

          const isDataEmpty = (
            (typedData.church_similarity_data?.connections?.length ?? 0) === 0 &&
            (typedData.community_similarity_data?.connections?.length ?? 0) === 0
          );

          if (isDataEmpty) {
            await reFetchWithSampleData();
          } else {
            setNetworkData(typedData);
          }
        } else {
          const { data: newData, error: createError } = await supabase
            .from('network_connections')
            .insert({
              user_id: user.id,
              church_similarity_data: { connections: [], connections_between_nodes: [] },
              community_similarity_data: { connections: [], connections_between_nodes: [] },
              plan_similarity_data: { connections: [], connections_between_nodes: [] },
            })
            .select()
            .single();

          if (createError) throw createError;

          if (newData) {
            await reFetchWithSampleData();
          }
        }
      } catch (err: any) {
        console.error('Error fetching network connections:', err);
        setError(err.message);
        toast({
          title: 'Error loading network data',
          description: 'There was a problem loading your network connections.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchNetworkConnections();
  }, [user]);

  return {
    networkData,
    isLoading,
    error,
  };
}
