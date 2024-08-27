import { AUTHENTICATION_TIMEOUTS, IS_MOBILE_APP } from '@/constants';
import type { Migration, IOtherSettings } from '@/types';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (restoredValue.secureLoginTimeout === undefined) {
    return {
      ...restoredValue,
      secureLoginTimeout: IS_MOBILE_APP ? AUTHENTICATION_TIMEOUTS[0] : AUTHENTICATION_TIMEOUTS[5],
    };
  }
  return restoredValue;
};

export default migration;
