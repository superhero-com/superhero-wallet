import { decrypt, encrypt, type IKey } from '@/utils';
import { IWalletStorage, WalletStorage } from './WalletStorage';

export class EncryptedStorage implements IWalletStorage {
  private passwordKey: IKey;

  constructor(passwordKey: IKey) {
    this.passwordKey = passwordKey;
  }

  async set(key: string, value: string): Promise<void> {
    if (!value) {
      console.log('[EncryptedStorage] No value for key', key);
      return;
    }
    const encryptedValue = encrypt(this.passwordKey, value);
    WalletStorage.set(key, encryptedValue);
  }

  async get<T = Record<string, any>>(key: string): Promise<T | null> {
    const encryptedValue = await WalletStorage.get<string>(key);
    if (encryptedValue && this.passwordKey) {
      try {
        const decryptedValue = decrypt(this.passwordKey, encryptedValue);
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
