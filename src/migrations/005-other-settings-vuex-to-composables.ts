import type { Migration, IOtherSettings } from '@/types';
import { AUTHENTICATION_TIMEOUT_DEFAULT } from '@/constants';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (!restoredValue) {
    const { backedUpSeed = false, saveErrorLog = false } = (await collectVuexState()) || {};
    return {
      isSeedBackedUp: backedUpSeed,
      saveErrorLog,
      secureLoginTimeout: AUTHENTICATION_TIMEOUT_DEFAULT,
    };
  }
  return restoredValue;
};

export default migration;
