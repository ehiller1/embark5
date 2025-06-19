import { storageUtils } from './storage';

// Define the mapping of old keys to new keys
export const STORAGE_KEY_MAPPINGS: Record<string, string> = {
  // Avatar-related keys
  'selected_church_avatar': 'church_avatar',
  'selected_community_avatar': 'community_avatar',
  'debug_church_avatar_selected': 'debug_church_avatar',
  'debug_community_avatar_selected': 'debug_community_avatar',
  
  // Message-related keys
  'church_assessment_messages': 'church_messages',
  'community_assessment_messages': 'community_messages',
  
  // Research and Assessment keys
  'church_assessment_data': 'church_assessment',
  'community_assessment_data': 'community_assessment',
  'church_research_notes': 'church_research',
  'community_research_notes': 'community_research',
  'research_summary_content': 'research_summary',
  'ResearchSummary_content': 'research_summary',
  
  // Scenario-related keys
  'scenario_ai_response': 'scenario_response',
  'vocational_statement': 'narrative_vocation'
};

// Function to migrate a single key
const migrateKey = (oldKey: string, newKey: string): void => {
  const value = localStorage.getItem(oldKey);
  if (value !== null) {
    localStorage.setItem(newKey, value);
    // Keep old key for backward compatibility
    // localStorage.removeItem(oldKey); // Uncomment after migration is complete
  }
};

// Function to perform the migration
export const migrateStorageKeys = (): void => {
  Object.entries(STORAGE_KEY_MAPPINGS).forEach(([oldKey, newKey]) => {
    migrateKey(oldKey, newKey);
  });
};

// Function to check if migration is needed
export const needsMigration = (): boolean => {
  return Object.keys(STORAGE_KEY_MAPPINGS).some(key => 
    localStorage.getItem(key) !== null
  );
};

// Function to get a value with fallback to old key
export const getWithFallback = <T>(key: string, defaultValue: T): T => {
  const newKey = STORAGE_KEY_MAPPINGS[key] || key;
  const oldValue = storageUtils.getItem<T>(key, defaultValue);
  const newValue = storageUtils.getItem<T>(newKey, defaultValue);
  
  return newValue !== defaultValue ? newValue : oldValue;
};

// Function to set a value in both old and new keys
export const setWithBackwardCompat = <T>(key: string, value: T): void => {
  const newKey = STORAGE_KEY_MAPPINGS[key] || key;
  storageUtils.setItem(newKey, value);
  // Keep old key for backward compatibility
  storageUtils.setItem(key, value);
}; 