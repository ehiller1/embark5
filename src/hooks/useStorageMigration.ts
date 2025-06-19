import { useEffect } from 'react';
import { migrateStorageKeys, needsMigration } from '@/utils/storageMigration';
import { storageUtils } from '@/utils/storage';

export const useStorageMigration = () => {
  useEffect(() => {
    if (needsMigration()) {
      migrateStorageKeys();
    }
  }, []);

  return {
    getItem: storageUtils.getItem,
    setItem: storageUtils.setItem,
    removeItem: storageUtils.removeItem
  };
}; 