import { AUTHENTICATION_TIMEOUT_DEFAULT } from '@/constants';
import type { Migration, IOtherSettings } from '@/types';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (restoredValue.secureLoginTimeout === undefined) {
    return {
      ...restoredValue,
      secureLoginTimeout: AUTHENTICATION_TIMEOUT_DEFAULT,
    };
  }
  return restoredValue;
};

export default migration;
