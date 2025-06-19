import { STORAGE_KEY_MAPPINGS } from './storageMigration';

/**
 * Enhanced localStorage utility with error handling and size limits
 */

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

export const storageUtils = {
  /**
   * Sets an item in localStorage with error handling and size checking
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      const newKey = STORAGE_KEY_MAPPINGS[key] || key;
      const serializedValue = JSON.stringify(value);
      
      // Check size before storing
      if (serializedValue.length > MAX_STORAGE_SIZE) {
        throw new Error(`Data exceeds maximum storage size of ${MAX_STORAGE_SIZE} bytes`);
      }
      
      // Store in both new and old keys for backward compatibility
      localStorage.setItem(newKey, serializedValue);
      if (newKey !== key) {
        localStorage.setItem(key, serializedValue);
      }
    } catch (error) {
      console.error('[storageUtils] Error setting item:', error);
      throw error;
    }
  },
  
  /**
   * Gets an item from localStorage with error handling
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const newKey = STORAGE_KEY_MAPPINGS[key] || key;
      const value = localStorage.getItem(newKey) || localStorage.getItem(key);
      
      if (value === null) {
        return defaultValue;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[storageUtils] Error getting item:', error);
      return defaultValue;
    }
  },
  
  /**
   * Removes an item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      const newKey = STORAGE_KEY_MAPPINGS[key] || key;
      localStorage.removeItem(newKey);
      if (newKey !== key) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[storageUtils] Error removing item:', error);
    }
  },
  
  /**
   * Creates a backup of local storage items matching a prefix
   */
  backupItems: (prefix: string): { [key: string]: any } => {
    const backup: { [key: string]: any } = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            backup[key] = value;
          }
        }
      }
    } catch (error) {
      console.error('[storageUtils] Error creating backup:', error);
    }
    
    return backup;
  },
  
  /**
   * Restores items from a backup
   */
  restoreBackup: (backup: { [key: string]: any }): void => {
    try {
      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('[storageUtils] Error restoring backup:', error);
    }
  },
  
  /**
   * Gets total storage usage in bytes
   */
  getStorageUsage: (): number => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          total += key.length + (value ? value.length : 0);
        }
      }
      return total;
    } catch (error) {
      console.error('[storageUtils] Error calculating storage usage:', error);
      return 0;
    }
  },

  clear: (): void => {
    localStorage.clear();
  }
};
