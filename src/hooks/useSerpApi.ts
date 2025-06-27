
import { useState } from 'react';
import { supabase } from "@/integrations/lib/supabase";
import { toast } from '@/hooks/use-toast';
import { SearchResult } from '@/types/research'; // Import canonical SearchResult

interface UseSerpApiOptions {
  numResults?: number;
}

export const useSerpApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = async (query: string, options: UseSerpApiOptions = {}): Promise<SearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    // Log search initialization
    console.log('🔍 [useSerpApi] Search initialized:', {
      timestamp: new Date().toISOString(),
      query,
      options,
    });

    try {
      const startTime = performance.now();
      console.log('[useSerpApi] Preparing request payload:', { query, numResults: options.numResults || 5 });
      
      const { data: response, error: supabaseError } = await supabase.functions.invoke('serpapi', {
        body: {
          query,
          numResults: options.numResults || 5,
        },
      });
      
      const endTime = performance.now();
      console.log('[useSerpApi] Request timing:', {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
      
      console.log('[useSerpApi] Raw response:', response);
      console.log('[useSerpApi] Supabase error state:', supabaseError);

      if (supabaseError) {
        console.error('[useSerpApi] Function invocation error:', {
          error: supabaseError,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to call SerpAPI: ${supabaseError.message}`);
      }

      if (response.error) {
        console.error('[useSerpApi] API response error:', {
          error: response.error,
          timestamp: new Date().toISOString()
        });
        throw new Error(response.error);
      }

      if (!response.organic_results) {
        console.warn('[useSerpApi] No results:', {
          responseKeys: Object.keys(response),
          timestamp: new Date().toISOString()
        });
        throw new Error('SerpAPI returned no results');
      }

      const resultsWithIds: SearchResult[] = response.organic_results.map((result: any) => ({
        ...result,
        id: result.id || crypto.randomUUID(), // Ensure ID is always present
        type: 'web' as 'web', // Add the mandatory 'type' field
        title: result.title || '', // Ensure title is a string if canonical requires it (it's optional, so this is fine)
        snippet: result.snippet || '', // Ensure snippet is a string
      }));

      console.log('[useSerpApi] Processed results:', {
        count: resultsWithIds.length,
        firstResult: resultsWithIds[0],
        timestamp: new Date().toISOString()
      });

      setResults(resultsWithIds);
      return resultsWithIds;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform search';
      console.error('[useSerpApi] Search error details:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return [];
    } finally {
      console.log('[useSerpApi] Search operation completed', {
        success: !error,
        timestamp: new Date().toISOString()
      });
      setIsLoading(false);
    }
  };

  return {
    search,
    results,
    isLoading,
    error,
    clearResults: () => setResults([]),
    resetError: () => setError(null),
  };
};
