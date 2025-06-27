import { supabase } from '@/integrations/lib/supabase';
/**
 * Retrieves a prompt of the specified type from the database
 * No longer uses fallback prompts - will return an error if database retrieval fails
 */
export const getPromptByType = async (promptType: string): Promise<{ success: boolean; data?: { prompt: string; id: string; prompt_type: string; created_at: string }; error?: any }> => {
  const startTime = performance.now();
  console.log(`[scenarioPrompts] Getting prompt by type: ${promptType}`);
  
  try {
    // Get from database only - no fallbacks
    const { data, error } = await supabase
      .from('prompts')
      .select('id, prompt, prompt_type, created_at')
      .eq('prompt_type', promptType);
      
    const endTime = performance.now();
    console.log(`[scenarioPrompts] Database query for ${promptType} took ${(endTime - startTime).toFixed(2)}ms`);
    
    if (error) {
      console.error(`[scenarioPrompts] Error retrieving ${promptType} prompt:`, error);
      return { success: false, error };
    }
    
    console.log(`[scenarioPrompts] Query results for '${promptType}':`, data);
    
    // Check if we found any matching prompts
    if (data && data.length > 0) {
      console.log(`[scenarioPrompts] Successfully found prompt for '${promptType}', using first result:`, data[0]);
      return { 
        success: true, 
        data: data[0] 
      };
    } else {
      console.log(`[scenarioPrompts] No prompts found for type '${promptType}'`);
      return { success: false, error: `No prompts found for type '${promptType}'` };
    }
  } catch (err) {
    const endTime = performance.now();
    console.error(`[scenarioPrompts] Error retrieving ${promptType} prompt (took ${(endTime - startTime).toFixed(2)}ms):`, err);
    return { success: false, error: err };
  }
};

// Testing function to log and verify prompt retrieval
export const testScenarioPrompt = async (promptType = 'scenario_refinement') => {
  console.log(`[scenarioPrompts] Testing retrieval of '${promptType}'...`);
  const startTime = performance.now();
  
  const result = await getPromptByType(promptType);
  
  const endTime = performance.now();
  console.log(`[scenarioPrompts] Test for ${promptType} took ${(endTime - startTime).toFixed(2)}ms`);
  
  if (result.success && result.data?.prompt) {
    console.log(`[scenarioPrompts] Successfully retrieved ${promptType} prompt (from DB)`);
    console.log(`[scenarioPrompts] Prompt content: "${result.data.prompt.substring(0, 50)}..."`);
    return result.data;
  } else {
    console.error(`[scenarioPrompts] Failed to retrieve ${promptType} prompt:`, result.error);
    return null;
  }
};

// Keep testPromptRetrieval for debugging purposes, but don't use it in production flow
export const testPromptRetrieval = async () => {
  console.log("[scenarioPrompts] Testing prompt retrieval...");
  const startTime = performance.now();
  
  const promptTypesToTest = [
    'scenario_builder',      // Generate initial scenarios
    'scenario_refinement',   // Refine selected scenarios
    'scenario_interrogatory' // Question/explore selected scenarios
  ];
  
  let allSuccessful = true;
  const results: Record<string, any> = {};
  
  for (const promptType of promptTypesToTest) {
    console.log(`[scenarioPrompts] Testing retrieval of '${promptType}'...`);
    
    // Test with getPromptByType which no longer includes fallbacks
    const result = await getPromptByType(promptType);
    results[promptType] = result;
    
    if (result.success && result.data?.prompt) {
      console.log(`[scenarioPrompts] Successfully retrieved ${promptType} prompt (from DB)`);
      console.log(`[scenarioPrompts] Prompt content: "${result.data.prompt.substring(0, 50)}..."`);
    } else {
      console.error(`[scenarioPrompts] Failed to retrieve ${promptType} prompt:`, result.error);
      allSuccessful = false;
    }
  }
  
  const endTime = performance.now();
  console.log(`[scenarioPrompts] Complete prompt retrieval test took ${(endTime - startTime).toFixed(2)}ms`);
  
  return { allSuccessful, results };
};
