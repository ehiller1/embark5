import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/lib/supabase";
import { toast } from '@/hooks/use-toast';

export interface ResearchCategory {
  id: string;
  label: string;
  search_prompt: string;
  category_group: string;
  page_type: 'community_research' | 'church_research';
}

export function useResearchCategories(pageType: 'community_research' | 'church_research') {
  const [categories, setCategories] = useState<ResearchCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log(`[useResearchCategories] Fetching categories for ${pageType}`);
        
        const { data, error } = await supabase
          .from('research_categories')
          .select('*')
          .eq('page_type', pageType)
          .order('category_group', { ascending: true });

        if (error) {
          console.error('[useResearchCategories] Error fetching categories:', error);
          throw error;
        }
        
        console.log(`[useResearchCategories] Fetched ${data?.length || 0} categories for ${pageType}`);
        setCategories(data || []);
      } catch (error) {
        console.error('[useResearchCategories] Error fetching research categories:', error);
        toast({
          title: "Error loading categories",
          description: "Failed to load research categories. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [pageType]);

  return { categories, loading };
}
