import type { Migration, IOtherSettings } from '@/types';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (restoredValue.isBiometricLoginEnabled !== undefined) {
    return restoredValue;
  }
  if ((restoredValue as any).isSecureLoginEnabled !== undefined) {
    return {
      ...restoredValue,
      isSecureLoginEnabled: undefined,
      isBiometricLoginEnabled: (restoredValue as any).isSecureLoginEnabled,
    };
  }
  return restoredValue;
};

export default migration;
