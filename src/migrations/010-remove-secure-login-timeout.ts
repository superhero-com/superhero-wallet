import type { IOtherSettings, Migration } from '@/types';

const migration: Migration<IOtherSettings> = (restoredValue: any) => {
  // eslint-disable-next-line no-param-reassign
  delete restoredValue?.secureLoginTimeout;
  return restoredValue;
};

export default migration;
