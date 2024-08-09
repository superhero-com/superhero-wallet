import { STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import CryptoJS from 'crypto-js';
import { toRaw } from 'vue';

export interface IKey {
  key: string;
  salt: string;
  iv: string;
}

export function generateKey(password: string, data?: any): IKey {
  // Generate a random salt or extract it from the data
  const salt = data
    ? CryptoJS.lib.WordArray.create(data.words.slice(0, 4))
    : CryptoJS.lib.WordArray.random(16);
  // Generate a random IV or extract it from the data
  const iv = data
    ? CryptoJS.lib.WordArray.create(data.words.slice(4, 8))
    : CryptoJS.lib.WordArray.random(16);

  // Derive the key using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  });
  return { key, salt, iv };
}

export function encrypt(passwordKey: IKey, plaintext: string): string {
  const { key, salt, iv } = toRaw(passwordKey);

  // Encrypt the plaintext, wrapping it in an object with a value key
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ value: plaintext }), key, { iv });

  // Concatenate salt, IV, and cipher-text
  const encryptedMessage = CryptoJS.enc.Base64.stringify(
    salt.concat(iv).concat(encrypted.ciphertext),
  );
  return encryptedMessage;
}

export function decrypt(passwordKey: IKey, encryptedMessage: string): string {
  // Decode from base64
  const data = CryptoJS.enc.Base64.parse(encryptedMessage);
  const { key, iv } = toRaw(passwordKey);
  const ciphertext = CryptoJS.lib.WordArray.create(data.words.slice(8));

  // Decrypt the ciphertext
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    { iv },
  );

  // Unwrap the plaintext
  const decryptedText = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)).value;
  return decryptedText;
}

export async function authenticateWithPassword(password: string): Promise<IKey> {
  const encryptedMnemonic = await WalletStorage.get<string>(STORAGE_KEYS.mnemonic);
  if (encryptedMnemonic) {
    try {
      const data = CryptoJS.enc.Base64.parse(encryptedMnemonic);
      const key = generateKey(password, data);
      const decryptedMnemonic = decrypt(key, encryptedMnemonic);
      if (decryptedMnemonic) {
        return Promise.resolve(key);
      }
      return Promise.reject(new Error('Incorrect password.'));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return Promise.reject(new Error('No encrypted mnemonic found.'));
}
