import type { Migration, IOtherSettings } from '@/types';
import { AUTHENTICATION_TIMEOUTS, IS_MOBILE_APP } from '@/constants';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (!restoredValue) {
    const { backedUpSeed = false, saveErrorLog = false } = (await collectVuexState()) || {};
    return {
      isSeedBackedUp: backedUpSeed,
      saveErrorLog,
      secureLoginTimeout: IS_MOBILE_APP ? AUTHENTICATION_TIMEOUTS[0] : AUTHENTICATION_TIMEOUTS[5],
    };
  }
  return restoredValue;
};

export default migration;
