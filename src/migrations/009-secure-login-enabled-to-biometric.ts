import type { Migration, IOtherSettings } from '@/types';

const migration: Migration<IOtherSettings> = async (restoredValue: IOtherSettings) => {
  if (restoredValue.isBiometricLoginEnabled !== undefined) {
    return restoredValue;
  }
  if ((restoredValue as any).isSecureLoginEnabled !== undefined) {
    const newValue = {
      ...restoredValue,
      isBiometricLoginEnabled: (restoredValue as any).isSecureLoginEnabled,
    };
    delete (newValue as any).isSecureLoginEnabled;
    return newValue;
  }
  return restoredValue;
};

export default migration;
