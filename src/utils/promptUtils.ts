import { supabase } from '@/integrations/lib/supabase';

// Cache for prompts
// Define PromptType from the array of required prompt types
export type PromptType = typeof REQUIRED_PROMPT_TYPES[number];

const promptCache = new Map<PromptType, Prompt>();

export interface Prompt {
  id: string;
  prompt_type: string;
  prompt: string;
  description?: string;
  created_at?: string;
}

export interface PromptTemplate {
  template: string;
  parameters: string[];
}

// Add the narrative_response to the required prompts
export const REQUIRED_PROMPT_TYPES = [
  'church_research',
  'community_research',
  'scenario_builder',
  'scenario_refinement',
  'scenario_interrogatory',
  'church_avatars', // Correct prompt type used in database
  'community_assessment',
  'church_assessment',
  // 'community_avatar_prompt', // Not strictly required for core narrative build flow
  'narrative_building',
  'narrative_builder_intro',
  'section_avatar_intro',
  'narrative_response',
  'assessment_report',
  'conversation',
  'discernment_plan',
  'strategic_plan', // Added for strategic plan generation
  'fundraise', // Added for fundraising campaign generation
  // 'scenario_response', // Specific to certain dialog interactions, not globally required
  'unified_scenario_response',
  'no_scenario_discernment',
  'vocational_statement_synthesis', // Added for AI synthesis of vocational statements
  'vocational_statement_synthesized_multiple', // Added for AI synthesis of multiple vocational statements
  'missional_avatar', // Added for generating vocation-based missional avatars
  'viability', // Added for viability assessment messages
  'community_avatar_generation' // Added for community avatar generation
] as const;

// Check if required prompts exist
export const createRequiredPrompts = async () => {
  try {
    console.log('[promptUtils] Checking for required prompts in the database...');
    
    // Get existing prompts
    const { data: existingPrompts, error: fetchError } = await supabase
      .from('prompts')
      .select('prompt_type');
    
    if (fetchError) {
      console.error('[promptUtils] Error fetching existing prompts:', fetchError);
      return false;
    }
    
    const existingPromptTypes = existingPrompts?.map(p => p.prompt_type) || [];
    console.log('[promptUtils] Existing prompt types in database:', existingPromptTypes);
    
    const missingPromptTypes = REQUIRED_PROMPT_TYPES.filter(
      type => !existingPromptTypes.includes(type)
    );
    
    if (missingPromptTypes.length === 0) {
      console.log('[promptUtils] All required prompts already exist');
      return true;
    }
    
    console.log('[promptUtils] Missing prompt types:', missingPromptTypes);

    // Add missing prompts
    for (const type of missingPromptTypes) {
      let promptTemplate = '';
      
      switch (type) {
        case 'community_assessment':
          // No fallback prompt - must use database prompt only
          throw new Error('community_assessment prompt must be retrieved from database');
          break;
        // ... other cases ...
      }

      if (promptTemplate) {
        const { error: insertError } = await supabase
          .from('prompts')
          .insert([{
            prompt_type: type,
            prompt: promptTemplate,
            description: `Template for ${type}`
          }]);

        if (insertError) {
          console.error(`[promptUtils] Error creating ${type} prompt:`, insertError);
          return false;
        }
      }
    }
    
    console.log('[promptUtils] Successfully created missing prompts');
    return true;
    
  } catch (err) {
    console.error('[promptUtils] Error in createRequiredPrompts:', err);
    return false;
  }
};

/**
 * Gets a prompt by type from the database
 */
export async function getPromptByType(type: PromptType): Promise<{ success: boolean; data?: Prompt; error?: any }> {
  // Check cache first
  if (promptCache.has(type)) {
    console.log(`[promptUtils] Returning cached prompt for type: ${type}`);
    return { success: true, data: promptCache.get(type) };
  }

  try {
    console.log(`[promptUtils] Fetching prompt from DB for type: ${type}`);
    
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_type', type);
    
    if (error) {
      console.error(`[promptUtils] Error fetching ${type} prompt:`, error);
      return { success: false, error };
    }
    
    if (!data || data.length === 0) {
      console.log(`[promptUtils] No ${type} prompt found in database`);
      return { success: false, error: `No ${type} prompt found` };
    }
    
    // If multiple prompts exist, log a warning and use the most recent one
    if (data.length > 1) {
      console.warn(`[promptUtils] Multiple prompts found for type ${type}, using most recent`);
      // Sort by created_at in descending order and take the first one
      // Sort by created_at in descending order and take the first one
      const sortedData = data.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      promptCache.set(type, sortedData[0]); // Cache the chosen prompt
      return { success: true, data: sortedData[0] };
    }
    
    console.log(`[promptUtils] Successfully retrieved prompt for type: ${type}`);
    promptCache.set(type, data[0]); // Cache the fetched prompt
    return { success: true, data: data[0] };
    
  } catch (err) {
    console.error(`[promptUtils] Error in getPromptByType for ${type}:`, err);
    return { success: false, error: err };
  }
}

/**
 * Adds a new prompt to the database
 */
export const addPromptToDb = async (newPrompt: Omit<Prompt, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .insert([newPrompt])
      .select();
    
    if (error) {
      console.error('[promptUtils] Error adding prompt:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error('[promptUtils] Error in addPromptToDb:', err);
    return { success: false, error: err };
  }
};

/**
 * Deletes a prompt from the database
 */
export const deletePromptFromDb = async (id: string) => {
  try {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[promptUtils] Error deleting prompt:', error);
      return { success: false, error };
    }
    
    return { success: true };
    
  } catch (err) {
    console.error('[promptUtils] Error in deletePromptFromDb:', err);
    return { success: false, error: err };
  }
};


// export function populatePrompt(template: string, parameters: Record<string, string>): string {
//   console.log(`template -> ${template} , parameters -> ${JSON.stringify(parameters)} `);
//   let populatedTemplate = template;
//   for (const [key, value] of Object.entries(parameters)) {
//     // Handle both $(key) and <KEY> formats
//     const placeholders = [
//       `$(${key})`,
//       `<${key.toUpperCase()}>`
//     ];
    
//     for (const placeholder of placeholders) {
//       populatedTemplate = populatedTemplate.replace(new RegExp(placeholder, 'g'), value);
//     }
//   }
//   console.log(`issue with -> ${populatedTemplate}`);
//   return populatedTemplate;
// }

export function populatePrompt(template: string, parameters: Record<string, string>): string {
  console.log(`template -> ${template} , parameters -> ${JSON.stringify(parameters)} `);
  let populatedTemplate = template;

  for (const [key, value] of Object.entries(parameters)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
    // Define all supported placeholder formats
    const placeholders = [
      { pattern: `\\$\\{${escapedKey}\\}`, flags: 'g' },        // ${key}
      { pattern: `\\$\\(${escapedKey}\\)`, flags: 'g' },         // $(key)
      { pattern: `<${escapedKey.toUpperCase()}>`, flags: 'g' }   // <KEY>
    ];

    for (const { pattern, flags } of placeholders) {
      const regex = new RegExp(pattern, flags);
      populatedTemplate = populatedTemplate.replace(regex, value);
    }
  }

  console.log(`Final populated template -> ${populatedTemplate}`);
  return populatedTemplate;
}



export interface PromptParameter {
  required: boolean;
  description: string;
  defaultValue?: string;
}

export interface PromptParameterConfig {
  [key: string]: {
    [param: string]: PromptParameter;
  };
}

export const PROMPT_PARAMETERS: PromptParameterConfig = {
  section_avatar_intro: {},
  vocation_interrogatory: {},
  unified_scenario_response: {
    scenario_details: { required: true, description: 'scenario_details' },
    message_history: { required: true, description: 'message_history' },
    church_avatar: { required: true, description: 'church_avatar' },
    community_avatar: { required: true, description: 'community_avatar' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  missional_avatar: {},
  narrative_response: {},
  narrative_builder_intro: {},
  no_scenario_discernment: {
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  resources: {},
  scenario_adaptation: {
    scenario_details: { required: true, description: 'scenario_details' },
    message_history: { required: true, description: 'message_history' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  narrative_building: {
    research_summary: { required: true, description: 'research_summary' },
    companion_avatar: { required: true, description: 'companion avatar' },
    church_avatar: { required: true, description: 'church_avatar' },
    community_avatar: { required: true, description: 'community_avatar' }
  },
  scenario_builder: {
    research_summary: { required: true, description: 'research_summary' },
    vocational_statement: { required: true, description: 'vocational_statement' },
    church_avatar: { required: true, description: 'church_avatar' },
    community_avatar: { required: true, description: 'community_avatar' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  scenario_interrogatory: {
    selected_scenario: { required: true, description: 'selected_scenario' },
    companion_avatar: { required: true, description: 'companion_avatar' },
    church_avatar: { required: true, description: 'church avatar' },
    community_avatar: { required: true, description: 'community_avatar' },
    messages_entered: { required: true, description: 'messages entered' }
  },
  assessment_report: {
    church_name: { required: true, description: 'church_name' },
    location: { required: true, description: 'location' },
    church_assessment_messages: { required: true, description: 'church_assessment_messages' },
    community_assessment_messages: { required: true, description: 'community_assessment_messages' },
    church_assessment_data: { required: true, description: 'church_assessment_data' },
    community_assessment_data: { required: true, description: 'community_assessment_data' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  church_assessment: {
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  church_avatars: {
    research_summary: { required: true, description: 'research_summary' },
    church_assessment: { required: true, description: 'church_assessment' },
    community_research: { required: true, description: 'community_research' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  church_research: {},
  scenario_refinement: {
    'scenario-details': { required: true, description: 'scenario-details' },
    message_history: { required: true, description: 'message_history' },
    church_avatar: { required: true, description: 'church_avatar' },
    community_avatar: { required: true, description: 'community_avatar' },
    scenario_details: { required: true, description: 'scenario_details' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  community_assessment: {
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' },
    community_research: { required: true, description: 'community_research' },
    location: { required: false, description: 'user_location' },
    community_avatar_name: { required: false, description: 'community_avatar_name' },
    community_avatar_description: { required: false, description: 'community_avatar_description' }
  },
  community_avatar_generation: {
    research_summary: { required: true, description: 'research_summary' },
    community_assessment: { required: true, description: 'community_assessment' },
    community_research: { required: true, description: 'community_research' }
  },
  community_avatars: {},
  community_research: {},
  conversation: {    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  },
  discernment_plan: {
    vocational_statement: { required: true, description: 'vocational_statement' },
    selected_scenarios: { required: true, description: 'selected_scenarios' },
    messages_history: { required: true, description: 'messages_history' },
    church_avatar: { required: true, description: 'church_avatar' },
    community_avatar: { required: true, description: 'community_avatar' },
    companion_avatar: { required: true, description: 'companion_avatar' },
    companion_name: { required: true, description: 'companion_name' },
    companion_type: { required: true, description: 'companion_type' },
    companion_traits: { required: true, description: 'companion_traits' },
    companion_speech_pattern: { required: true, description: 'companion_speech_pattern' },
    companion_knowledge_domains: { required: true, description: 'companion_knowledge_domains' }
  }
};

export function getPromptParameters(type: PromptType): Record<string, PromptParameter> {
  const parameters = PROMPT_PARAMETERS[type];
  if (!parameters) {
    throw new Error(`No parameters found for prompt type: ${type}`);
  }
  return parameters;
}

export async function validateAndPopulatePrompt(
  prompt: Prompt,
  parameters: Record<string, string>
): Promise<string> {
  if (!prompt.prompt) {
    throw new Error('Prompt text is empty');
  }

  const promptType = prompt.prompt_type as PromptType;
  if (!PROMPT_PARAMETERS[promptType]) {
    throw new Error(`No parameter mapping found for prompt type: ${promptType}`);
  }

  const requiredParams = Object.entries(PROMPT_PARAMETERS[promptType])
    .filter(([_, config]) => config.required)
    .map(([param]) => param);

  const missingParams = requiredParams.filter(param => !parameters[param]);
  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  let populatedPrompt = prompt.prompt;
  for (const [param, value] of Object.entries(parameters)) {
    const paramConfig = PROMPT_PARAMETERS[promptType][param];
    if (paramConfig) {
      const placeholder = `$(${param})`;
      populatedPrompt = populatedPrompt.replace(placeholder, value || paramConfig.defaultValue || '');
    }
  }

  return populatedPrompt;
}

export async function migratePromptsToStandardizedFormat(): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    // Get all existing prompts
    const { data: existingPrompts, error: fetchError } = await supabase
      .from('prompts')
      .select('*');

    if (fetchError) {
      console.error('Error fetching existing prompts:', fetchError);
      return { success: false, migratedCount: 0, error: fetchError.message };
    }

    if (!existingPrompts || existingPrompts.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    let migratedCount = 0;
    const errors: string[] = [];

    // Process each prompt
    for (const prompt of existingPrompts) {
      try {
        // Get the standardized parameters for this prompt type
        const parameters = PROMPT_PARAMETERS[prompt.prompt_type];
        if (!parameters) {
          console.warn(`No parameter mapping found for prompt type: ${prompt.prompt_type}`);
          continue;
        }

        // Update the prompt with standardized parameter placeholders
        let updatedPrompt = prompt.prompt;
        for (const [key, _] of Object.entries(parameters)) {
          // Replace any existing variations of the parameter with the standardized format
          const variations = [
            key,
            key.replace(/_/g, ' '),
            key.replace(/_/g, '-'),
            key.toUpperCase(),
            key.toLowerCase()
          ];

          for (const variation of variations) {
            const regex = new RegExp(`\\$\\(${variation}\\)`, 'gi');
            updatedPrompt = updatedPrompt.replace(regex, `$(${key})`);
          }
        }

        // Update the prompt in the database if it was modified
        if (updatedPrompt !== prompt.prompt) {
          const { error: updateError } = await supabase
            .from('prompts')
            .update({ prompt: updatedPrompt })
            .eq('id', prompt.id);

          if (updateError) {
            errors.push(`Failed to update prompt ${prompt.id}: ${updateError.message}`);
          } else {
            migratedCount++;
          }
        }
      } catch (err) {
        errors.push(`Error processing prompt ${prompt.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some prompts failed to migrate:', errors);
    }

    return { 
      success: true, 
      migratedCount,
      error: errors.length > 0 ? `Some prompts failed to migrate: ${errors.join('; ')}` : undefined
    };
  } catch (err) {
    console.error('Error in prompt migration:', err);
    return { 
      success: false, 
      migratedCount: 0,
      error: err instanceof Error ? err.message : 'An unknown error occurred'
    };
  }
}
