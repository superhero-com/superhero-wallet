import type { IKey } from '@/types';
import { decrypt, encrypt } from '@/utils';
import { IWalletStorage, WalletStorage } from './WalletStorage';

export class EncryptedStorage implements IWalletStorage {
  private passwordKey: IKey;

  constructor(passwordKey: IKey) {
    this.passwordKey = passwordKey;
  }

  async set(key: string, value: string): Promise<void> {
    if (!value) {
      return;
    }
    const encryptedValue = await encrypt(this.passwordKey, value);
    WalletStorage.set(key, encryptedValue);
  }

  async get<T = Record<string, any>>(key: string): Promise<T | null> {
    const encryptedValue = await WalletStorage.get<string>(key);
    if (encryptedValue && this.passwordKey) {
      try {
        const decryptedValue = await decrypt(this.passwordKey, encryptedValue);
        try {
          return JSON.parse(decryptedValue) as T;
        } catch (e) {
          return decryptedValue as T;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async remove(key: string): Promise<void> {
    WalletStorage.remove(key);
  }

  // eslint-disable-next-line class-methods-use-this
  async clear(): Promise<void> {
    WalletStorage.clear();
  }
}
