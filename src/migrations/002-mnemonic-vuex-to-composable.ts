import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { Migration } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration = async (restoredValue: string) => {
  if (!restoredValue) {
    const mnemonic = (await collectVuexState())?.mnemonic;
    if (mnemonic && validateMnemonic(mnemonic, wordlist)) {
      return mnemonic;
    }
  }
  return restoredValue;
};

export default migration;
