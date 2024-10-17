import type { Migration } from '@/types';
import { WalletStorage } from '@/lib/WalletStorage';
import { STORAGE_KEYS } from '@/constants';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';

const migration: Migration = async (restoredMnemonic: string) => {
  const oldMnemonic = WalletStorage.get(STORAGE_KEYS.mnemonic);
  if (oldMnemonic) {
    SecureMobileStorage.set(STORAGE_KEYS.mnemonic, oldMnemonic);
    WalletStorage.remove(STORAGE_KEYS.mnemonic);
    return oldMnemonic;
  }
  return restoredMnemonic;
};

export default migration;
