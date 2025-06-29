import { useState, useEffect } from 'react';
import { getPromptByType as fetchPromptByType, Prompt, PromptType } from '@/utils/promptUtils';


interface PromptsData {
  prompts: { [key: string]: Prompt };
  isLoading: boolean;
  error: string | null;
  refreshPrompts: () => Promise<void>;
  getPromptByType: (type: PromptType) => Promise<Prompt | null>;
}

/**
 * Hook for fetching and managing prompts data
 */
export const usePromptsData = (): PromptsData => {
  const [prompts, setPrompts] = useState<{ [key: string]: Prompt }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPrompts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all required prompts
      const promptTypes: PromptType[] = ['community_assessment', 'assessment_report', 'church_assessment'];
      const promptPromises = promptTypes.map(type => fetchPromptByType(type));
      const results = await Promise.all(promptPromises);
      
      // Convert array to object with type as key
      const promptsMap = results.reduce<{ [key: string]: Prompt }>((acc, result) => {
        if (result.success && result.data) {
          acc[result.data.prompt_type] = result.data;
        }
        return acc;
      }, {});
      
      setPrompts(promptsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPrompts();
  }, []);

  const getPromptByType = async (promptType: PromptType): Promise<Prompt | null> => {
    const result = await fetchPromptByType(promptType);
    return result.success && result.data ? result.data : null;
  };

  return {
    prompts,
    isLoading,
    error,
    refreshPrompts,
    getPromptByType
  };
};
