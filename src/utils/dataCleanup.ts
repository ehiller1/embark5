
/**
 * Utility functions for cleaning up application data
 */

/**
 * Deletes all application data from localStorage
 * @returns Object containing the names of cleared storage items
 */
export const resetAllLocalStorage = (): { clearedItems: string[] } => {
  // List of all localStorage keys used in the application
  const appStorageKeys = [
    // Church assessment data
    'church_name',
    'user_location',
    'church_assessment_messages',
    
    // Selected scenarios
    'selected_scenarios',
    
    // Narrative avatar data
    'narrative_avatar_tasks',
    'selected_church_avatars',
    'selected_church_avatar',
    'selected_community_avatars',
    'selected_community_avatar',
    'selected_narrative_avatar',
    
    // Companion data
    'selected_companion',
    'companion_changed'
  ];
  
  const clearedItems: string[] = [];

  // Remove each key from localStorage if it exists
  appStorageKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      clearedItems.push(key);
    }
  });

  console.log('Reset all local storage data:', clearedItems);
  return { clearedItems };
};
