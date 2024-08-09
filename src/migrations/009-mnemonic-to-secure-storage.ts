import { validateMnemonic } from '@aeternity/bip39';
import type { Migration } from '@/types';
import { useAccounts } from '@/composables';

const migration: Migration = async (restoredValue: string) => {
  if (restoredValue) {
    if (validateMnemonic(restoredValue)) {
      const { setMnemonic } = useAccounts();
      await setMnemonic(restoredValue, true);
      return restoredValue;
    }
  }
  return null;
};

export default migration;
