import type { Migration, IOtherSettings } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (!restoredValue) {
    const { backedUpSeed = false, saveErrorLog = false } = (await collectVuexState()) || {};
    return {
      isSeedBackedUp: backedUpSeed,
      saveErrorLog,
    };
  }
  return restoredValue;
};

export default migration;
