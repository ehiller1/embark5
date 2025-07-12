import { supabase } from '@/integrations/lib/supabase';

/**
 * Checks if a church profile exists for the given church ID
 * @param churchId The ID of the church to check
 * @returns Promise<boolean> True if profile exists, false otherwise
 */
export const checkChurchProfileExists = async (churchId: string): Promise<boolean> => {
  // Only log in development environment
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log('[checkChurchProfileExists] Checking church profile for churchId:', churchId);
  }
  
  if (!churchId) {
    if (isDev) console.log('[checkChurchProfileExists] No churchId provided, returning false');
    return false;
  }

  try {
    // Try first approach: check church_profile table
    if (isDev) console.log('[checkChurchProfileExists] Querying church_profile table...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('church_profile')
      .select('church_id')
      .eq('church_id', churchId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (isDev && profileError && profileError.code !== 'PGRST116') {
      // Only log actual errors, not expected "not found" errors
      console.warn('[checkChurchProfileExists] Profile query error:', profileError);
    }
    
    if (profileData?.church_id) {
      if (isDev) console.log('[checkChurchProfileExists] Found profile in church_profile table');
      return true;
    }

    // If first approach fails, try second approach: check profiles table
    if (isDev) console.log('[checkChurchProfileExists] Trying alternate profiles table...');
    
    const { data: altProfileData, error: altProfileError } = await supabase
      .from('profiles') 
      .select('id, church_name')
      .eq('id', churchId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (isDev && altProfileError && altProfileError.code !== 'PGRST116') {
      // Only log actual errors, not expected "not found" errors
      console.warn('[checkChurchProfileExists] Alternate profile query error:', altProfileError);
    }

    // Consider profile complete if it has a church_name
    if (altProfileData?.church_name) {
      if (isDev) console.log('[checkChurchProfileExists] Found profile in profiles table with church_name');
      return true;
    }
    
    // If both approaches fail, return false
    if (isDev) console.log('[checkChurchProfileExists] No profile found in any table, returning false.');
    return false; // No profile found
  } catch (error) {
    console.error('[checkChurchProfileExists] Exception checking church profile:', error);
    // Return false on error
    return false;
  }
};

/**
 * Checks if a resource exists in the resource library for the given church ID and resource type
 * @param churchId The ID of the church to check
 * @param resourceType The type of resource to check for
 * @returns Promise<boolean> True if resource exists, false otherwise
 */
export const checkResourceExists = async (churchId: string, resourceType: string): Promise<boolean> => {
  if (!churchId || !resourceType) return false;

  try {
    const { data, error } = await supabase
      .from('resource_library')
      .select('id')
      .eq('church_id', churchId)
      .eq('resource_type', resourceType)
      .limit(1);

    if (error) {
      console.error(`Error checking resource ${resourceType}:`, error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error(`Exception checking resource ${resourceType}:`, error);
    return false;
  }
};

/**
 * Checks if any of the specified local storage keys exist
 * @param keys Array of local storage keys to check
 * @returns boolean True if any key exists, false otherwise
 */
export const checkLocalStorageKeys = (keys: string[]): boolean => {
  return keys.some(key => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error accessing localStorage key ${key}:`, error);
      return false;
    }
  });
};

// Define the card types as a const array for type safety
export const CARD_TYPES = [
  'churchProfile',
  'churchResearch',
  'churchAssessment',
  'communityResearch',
  'communityAssessment',
  'researchSummary',
  'vocationalStatement',
  'scenario',
  'surveySummary',
  'resourceLibrary',
  'scenarioBuilding',
  'implementationTesting',
  'discernmentPlan',
  'ministryInsights',
  'connectWithChurches'
] as const;

export type CardType = typeof CARD_TYPES[number];

// Map of card types to their corresponding resource types and local storage keys
export const CARD_STATE_CONFIG: Record<CardType, {
  resourceType?: string;
  storageKeys: string[] | ((churchId: string) => string[]);
  checkDb?: (churchId: string) => Promise<boolean>;
}> = {
  churchProfile: {
    checkDb: (churchId: string) => checkChurchProfileExists(churchId),
    storageKeys: (churchId: string) => [
      `cp_accomplish_${churchId}`,
      `cp_community_${churchId}`,
      `cp_dream_${churchId}`,
      `cp_activeMembers_${churchId}`,
      `cp_pledgingMembers_${churchId}`
    ]
  } as const,
  churchResearch: {
    resourceType: 'church_research',
    storageKeys: ['church_research_data', 'church_research_messages']
  } as const,
  churchAssessment: {
    resourceType: 'church_assessment',
    storageKeys: ['church_assessment_data', 'church_assessment_messages']
  } as const,
  communityAssessment: {
    resourceType: 'community_assessment',
    storageKeys: ['community_assessment_data', 'community_assessment_messages']
  } as const,
  communityResearch: {
    resourceType: 'community_research',
    storageKeys: ['community_research_data', 'community_research_messages']
  } as const,
  researchSummary: {
    resourceType: 'research_summary',
    storageKeys: ['research_summary']
  } as const,
  vocationalStatement: {
    resourceType: 'vocational_statement',
    storageKeys: ['vocational_statement']
  } as const,
  scenario: {
    resourceType: 'scenario',
    storageKeys: ['scenario_data', 'scenario']
  } as const,
  surveySummary: {
    resourceType: 'survey_summary',
    storageKeys: ['survey_summary'],
    checkDb: async (churchId: string) => {
      // Check if the conversation_history table has entries with page type 'parish_survey'
      try {
        const { data, error } = await supabase
          .from('conversation_history')
          .select('id')
          .eq('church_id', churchId)
          .eq('conversation_page', 'parish_survey')
          .limit(1);
        
        if (error) {
          console.error('Error checking survey summary:', error);
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        console.error('Exception checking survey summary:', error);
        return false;
      }
    }
  } as const,
  resourceLibrary: {
    resourceType: 'resource',
    storageKeys: ['resource_accessed'],
    checkDb: async (churchId: string) => {
      try {
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .limit(1);
        
        if (error) {
          console.error('Error checking resource library:', error);
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        console.error('Exception checking resource library:', error);
        return false;
      }
    }
  } as const,
  scenarioBuilding: {
    resourceType: 'scenario_building',
    storageKeys: ['scenario_data', 'scenario'],
    checkDb: async (churchId: string) => {
      // Check scenario from resource_library table with type filter
      try {
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .eq('resource_type', 'scenario_building')
          .limit(1);
        
        if (error) {
          console.error('Error checking scenario building:', error);
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        console.error('Exception checking scenario building:', error);
        return false;
      }
    }
  } as const,
  implementationTesting: {
    resourceType: 'implementation_testing',
    storageKeys: ['implementation_data'],
    checkDb: async (churchId: string) => {
      try {
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .eq('resource_type', 'implementation_testing')
          .limit(1);
        
        if (error) {
          console.error('Error checking implementation testing:', error);
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        console.error('Exception checking implementation testing:', error);
        return false;
      }
    }
  } as const,
  discernmentPlan: {
    resourceType: 'discernment_plan',
    storageKeys: ['discernment_plan', 'plan_build'],
    checkDb: async (churchId: string) => {
      try {
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .eq('resource_type', 'discernment_plan')
          .limit(1);
        
        if (error) {
          console.error('Error checking discernment plan:', error);
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        console.error('Exception checking discernment plan:', error);
        return false;
      }
    }
  } as const,
  ministryInsights: {
    resourceType: 'ministry_insights',
    storageKeys: ['ministry_insights'],
    checkDb: async (churchId: string) => {
      try {
        // Since user_activity table does not exist, we'll check resource_library instead
        // looking for resources related to ministry insights
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .eq('resource_type', 'ministry_insights')
          .limit(1);

        if (error) {
          // Silently handle error and return false to avoid console errors
          return false;
        }

        return (data?.length || 0) > 0;
      } catch (error) {
        // Silently handle error and return false
        return false;
      }
    }
  } as const,
  connectWithChurches: {
    resourceType: 'connect_with_churches',
    storageKeys: ['connect_with_churches_accessed'],
    checkDb: async (churchId: string) => {
      try {
        // Since user_activity table does not exist, we'll check resource_library instead
        // looking for resources related to connecting with churches
        const { data, error } = await supabase
          .from('resource_library')
          .select('id')
          .eq('church_id', churchId)
          .eq('resource_type', 'connect_with_churches')
          .limit(1);
        
        if (error) {
          // Silently handle error and return false to avoid console errors
          return false;
        }
        
        return (data?.length || 0) > 0;
      } catch (error) {
        // Silently handle error and return false
        return false;
      }
    }
  } as const
} as const;

// CardType is already defined above

/**
 * Checks if a card should be marked as completed based on database and local storage
 * @param cardType The type of card to check
 * @param churchId The ID of the church
 * @returns Promise<boolean> True if the card should be marked as completed
 */
export const checkCardCompletion = async (cardType: CardType, churchId: string): Promise<boolean> => {
  const config = CARD_STATE_CONFIG[cardType];
  
  if (!config) {
    console.warn(`No configuration found for card type: ${cardType}`);
    return false;
  }

  // Check local storage first
  const storageKeys = 'storageKeys' in config ? 
    (typeof config.storageKeys === 'function' ? config.storageKeys(churchId) : config.storageKeys) : [];
    
  if (storageKeys.length > 0 && checkLocalStorageKeys(storageKeys)) {
    return true;
  }

  // Check database if churchId is available
  if (churchId) {
    if ('checkDb' in config && config.checkDb) {
      return config.checkDb(churchId);
    } else if ('resourceType' in config && config.resourceType) {
      return checkResourceExists(churchId, config.resourceType);
    }
  }

  return false;
};

/**
 * Updates the completion states of all cards
 * @param churchId The ID of the church
 * @returns Promise<Record<CardType, boolean>> Object mapping card types to their completion states
 */
export const updateAllCardStates = async (churchId: string): Promise<Record<CardType, boolean>> => {
  const states: Partial<Record<CardType, boolean>> = {};
  
  // Process each card type in parallel
  await Promise.all(
    (Object.keys(CARD_STATE_CONFIG) as CardType[]).map(async (cardType) => {
      try {
        states[cardType] = await checkCardCompletion(cardType, churchId);
      } catch (error) {
        console.error(`Error checking completion for ${cardType}:`, error);
        states[cardType] = false;
      }
    })
  );

  return states as Record<CardType, boolean>;
};

/**
 * Saves scenario details to localStorage and the resource_library table
 * @param scenarioContent The scenario content to save
 * @param userId The user ID
 * @returns Promise resolving to the saved resource ID
 */
export async function saveScenarioDetails(
  scenarioContent: string | any | any[],
  userId: string
): Promise<string | null> {
  try {
    // Format the content based on the input type
    let formattedContent: string;
    
    if (typeof scenarioContent === 'string') {
      // If it's already a string, use it directly
      formattedContent = scenarioContent;
    } else if (Array.isArray(scenarioContent)) {
      // If it's an array of scenarios, format them
      formattedContent = scenarioContent
        .map(s => `${s.title}: ${s.description}`)
        .join('\n\n');
    } else {
      // If it's a single scenario object
      formattedContent = `${scenarioContent.title}: ${scenarioContent.description}`;
    }
    
    // Save to localStorage
    localStorage.setItem('scenario_details', formattedContent);
    
    // Save to database
    const { data, error } = await supabase
      .from('resource_library')
      .insert({
        user_id: userId,
        content: formattedContent,
        resource_type: 'scenario_details',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error saving scenario details to database:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in saveScenarioDetails:', error);
    return null;
  }
}

/**
 * Saves the vocational statement to localStorage and the resource-library table
 * @param statement The vocational statement content to save
 * @param userId The ID of the user saving the statement
 * @returns Promise with success status and any error
 */
export const saveVocationalStatement = async (statement: string, userId: string) => {
  try {
    // Save to localStorage first for immediate access
    localStorage.setItem('vocational_statement', statement);
    
    // Then save to the database resource-library table
    const { error } = await supabase
      .from('resource_library')
      .upsert({
        name: 'vocational_statement',
        content: statement,
        user_id: userId,
        resource_type: 'vocational_statement',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,name'
      });
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving vocational statement:', error);
    return { success: false, error };
  }
};
