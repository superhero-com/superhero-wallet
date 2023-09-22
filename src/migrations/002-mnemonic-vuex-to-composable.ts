import { validateMnemonic } from '@aeternity/bip39';
import type { Migration } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration = async (restoredValue: string) => {
  if (!restoredValue) {
    const mnemonic = (await collectVuexState())?.mnemonic;
    if (mnemonic && validateMnemonic(mnemonic)) {
      return mnemonic;
    }
  }
  return restoredValue;
};

export default migration;
