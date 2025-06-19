import { useCallback } from 'react';
import { usePromptsUI } from './usePromptsUI';
import { getPromptByType as getPromptByTypeDirectly, populatePrompt, PromptType } from '@/utils/promptUtils.ts';
import type { Prompt } from '@/utils/promptUtils';

/**
 * Main hook for working with prompts, re-exports functionality from the more specific hooks
 */
export function usePrompts() {
  const promptsUI = usePromptsUI();
  
  // Modified to use only the direct database access method without fallbacks
  const getPromptByType = useCallback(async (promptType: PromptType) => {
    console.log(`[usePrompts] Getting prompt by type: ${promptType} (using direct database access)`);
    
    try {
      const directResult = await getPromptByTypeDirectly(promptType);
      console.log(`[usePrompts] Direct database access result:`, directResult);
      
      return directResult;
    } catch (err) {
      console.error(`[usePrompts] Error in prompt access:`, err);
      return { success: false, error: err };
    }
  }, [getPromptByTypeDirectly]);
  
  // New function to get and populate a prompt with replacements
  const getAndPopulatePrompt = useCallback(async (promptType: PromptType, replacements: Record<string, string>) => {
    console.log(`[usePrompts] Getting and populating prompt by type: ${promptType} with replacements:`, replacements);
    
    try {
      console.log(`[usePrompts] Fetching prompt for type: ${promptType}`);
      const promptResult = await getPromptByType(promptType);
      
      if (!promptResult.success || !('data' in promptResult) || !promptResult.data?.prompt) {
        console.error(`[usePrompts] Failed to get ${promptType} prompt:`, {
          success: promptResult.success,
          hasData: 'data' in promptResult,
          hasPrompt: promptResult.data?.prompt ? true : false,
          error: promptResult.error
        });
        return { success: false, error: `Could not load ${promptType} prompt` };
      }
      
      console.log(`[usePrompts] Successfully retrieved prompt for ${promptType}, populating with replacements`);
      const populatedPrompt = await populatePrompt(promptResult.data.prompt, replacements);
      console.log(`[usePrompts] Successfully populated prompt for ${promptType}`);
      
      return { success: true, data: { prompt: populatedPrompt } };
    } catch (err) {
      console.error(`[usePrompts] Error in populating prompt:`, err);
      return { success: false, error: err };
    }
  }, [getPromptByType, populatePrompt]);
  
  return {
    ...promptsUI,
    getPromptByType,
    getAndPopulatePrompt
  };
}

// Export Prompt and PromptType interfaces
export type { Prompt, PromptType };
