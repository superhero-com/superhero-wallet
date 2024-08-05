import type { IKey } from '@/types';
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

export async function generateKey(password: string, encryptedMnemonic?: string): Promise<IKey> {
  const subtleCrypto = globalThis.crypto.subtle;
  const data = encryptedMnemonic
    ? new Uint8Array(decodeBase64(encryptedMnemonic))
    : null;

  // Generate a random salt or extract it from the data
  const salt = data ? data.slice(0, 16) : globalThis.crypto.getRandomValues(new Uint8Array(16));

  // Generate a random IV or extract it from the data
  const iv = data ? data.slice(16, 32) : globalThis.crypto.getRandomValues(new Uint8Array(16));

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

  return { key, salt, iv };
}

export async function encrypt(passwordKey: IKey, plaintext: string): Promise<string> {
  const { key, salt, iv } = toRaw(passwordKey);
  const subtleCrypto = globalThis.crypto.subtle;

  // Encrypt the plaintext
  const enc = new TextEncoder();
  const encryptedBuffer = await subtleCrypto.encrypt(
    {
      name: PASSWORD_ENCRYPTION_ALGO,
      iv,
    },
    key,
    enc.encode(JSON.stringify({ value: plaintext })),
  );

  // Concatenate salt, iv, and cipher-text
  const encryptedArray = new Uint8Array([...salt, ...iv, ...new Uint8Array(encryptedBuffer)]);

  // Convert to base64
  return encodeBase64(encryptedArray);
}

export async function decrypt(passwordKey: IKey, encryptedMessage: string): Promise<string> {
  const { key, iv } = toRaw(passwordKey);
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
  const decryptedText = JSON.parse(dec.decode(decryptedBuffer)).value;
  return decryptedText;
}

export async function authenticateWithPassword(password: string): Promise<IKey> {
  const encryptedMnemonic = await WalletStorage.get<string>(STORAGE_KEYS.mnemonic);
  if (encryptedMnemonic) {
    try {
      const key = await generateKey(password, encryptedMnemonic);
      const decryptedMnemonic = await decrypt(key, encryptedMnemonic);
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

export async function exportPasswordKey({ key, salt, iv }: IKey) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return { key: exportedKeyBuffer, salt, iv };
}

export async function importPasswordKey({ key, salt, iv }: any): Promise<IKey> {
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
