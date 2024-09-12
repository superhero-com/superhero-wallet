import type { IEncryptionData } from '@/types';
import { STORAGE_KEYS, PASSWORD_ENCRYPTION_ALGO, IS_EXTENSION } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { toRaw } from 'vue';

/**
 * If the application is running as an extension, the key should be extractable.
 * So that we can save it in the session storage.
 */
const IS_EXTRACTABLE = !!IS_EXTENSION;

// Utility Functions for Base64 Encoding and Decoding
const encodeBase64 = (data: Uint8Array) => Buffer.from(data).toString('base64');
const decodeBase64 = (data: string) => Buffer.from(data, 'base64');

async function generateCryptoKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtleCrypto = globalThis.crypto.subtle;

  // Encode password to ArrayBuffer
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  // Derive the key using PBKDF2
  const keyMaterial = await subtleCrypto.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const key = await subtleCrypto.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: PASSWORD_ENCRYPTION_ALGO, length: 256 },
    IS_EXTRACTABLE,
    ['encrypt', 'decrypt'],
  );

  return key;
}

export async function restoreEncryptionData(
  password:string,
  encryptedMnemonic: string,
): Promise<IEncryptionData> {
  const data = new Uint8Array(decodeBase64(encryptedMnemonic));
  // Extract salt and iv from the data
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 32);
  const key = await generateCryptoKey(password, salt);
  return { key, salt, iv };
}

export async function initializeEncryptionData(password: string): Promise<IEncryptionData> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const key = await generateCryptoKey(password, salt);
  return { key, salt, iv };
}

export async function encrypt(encryptionData: IEncryptionData, plaintext: string): Promise<string> {
  const { key, salt, iv } = toRaw(encryptionData);
  const subtleCrypto = globalThis.crypto.subtle;

  // Encrypt the plaintext
  const enc = new TextEncoder();
  const encryptedBuffer = await subtleCrypto.encrypt(
    {
      name: PASSWORD_ENCRYPTION_ALGO,
      iv,
    },
    key,
    enc.encode(plaintext),
  );

  // Concatenate salt, iv, and cipher-text
  const encryptedArray = new Uint8Array([...salt, ...iv, ...new Uint8Array(encryptedBuffer)]);

  // Convert to base64
  return encodeBase64(encryptedArray);
}

export async function decrypt(
  encryptionData: IEncryptionData,
  encryptedMessage: string,
): Promise<string> {
  const { key, iv } = toRaw(encryptionData);
  const subtleCrypto = globalThis.crypto.subtle;

  // Decode from base64
  const encryptedArray = new Uint8Array(decodeBase64(encryptedMessage));
  const ciphertext = encryptedArray.slice(32); // Skip salt (16 bytes) + IV (16 bytes)
  // Decrypt the ciphertext
  const decryptedBuffer = await subtleCrypto.decrypt(
    {
      name: PASSWORD_ENCRYPTION_ALGO,
      iv,
    },
    key,
    ciphertext,
  );

  // Unwrap the plaintext
  const dec = new TextDecoder();
  const decryptedText = dec.decode(decryptedBuffer);
  return decryptedText;
}

export async function authenticateWithPassword(password: string): Promise<IEncryptionData> {
  const encryptedMnemonic = await WalletStorage.get<string>(STORAGE_KEYS.mnemonic);
  if (encryptedMnemonic) {
    try {
      const encryptionData = await restoreEncryptionData(password, encryptedMnemonic);
      const decryptedMnemonic = await decrypt(encryptionData, encryptedMnemonic);
      if (decryptedMnemonic) {
        return Promise.resolve(encryptionData);
      }
      return Promise.reject(new Error('Incorrect password.'));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return Promise.reject(new Error('No encrypted mnemonic found.'));
}

export async function exportEncryptionData({ key, salt, iv }: IEncryptionData) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return { key: exportedKeyBuffer, salt, iv };
}

export async function importEncryptionData({ key, salt, iv }: any): Promise<IEncryptionData> {
  const subtleCrypto = globalThis.crypto.subtle;
  const importedKey = await subtleCrypto.importKey(
    'raw',
    key,
    { name: PASSWORD_ENCRYPTION_ALGO, length: 256 },
    IS_EXTRACTABLE,
    ['encrypt', 'decrypt'],
  );
  return { key: importedKey, salt, iv };
}
