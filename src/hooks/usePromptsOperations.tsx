
import { usePromptsData } from './usePromptsData';
import { Prompt, addPromptToDb, deletePromptFromDb, createRequiredPrompts } from '@/utils/promptUtils';

/**
 * Hook for prompt operations like adding, deleting and ensuring required prompts exist
 */
export function usePromptsOperations() {
  const { prompts, loading, error, refreshPrompts, getPromptByType } = usePromptsData();

  const addPrompt = async (newPrompt: Omit<Prompt, 'id' | 'created_at'>) => {
    const result = await addPromptToDb(newPrompt);
    if (result.success) {
      refreshPrompts();
    }
    return result;
  };

  const deletePrompt = async (id: string) => {
    const result = await deletePromptFromDb(id);
    if (result.success) {
      refreshPrompts();
    }
    return result;
  };

  const ensureRequiredPromptsExist = async () => {
    const success = await createRequiredPrompts();
    if (success) {
      refreshPrompts();
    }
    return success;
  };

  return {
    prompts,
    loading,
    error,
    addPrompt,
    deletePrompt,
    getPromptByType,
    refreshPrompts,
    ensureRequiredPromptsExist
  };
}
