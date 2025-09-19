import type { IEncryptionResult } from '@/types';
import { PASSWORD_ENCRYPTION_ALGO, IS_EXTENSION } from '@/constants';

/**
 * If the application is running as an extension, the key should be extractable.
 * So that we can save it in the session storage.
 */
const IS_EXTRACTABLE = !!IS_EXTENSION;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;

const subtleCrypto = globalThis?.crypto?.subtle;

// Utility Functions for Base64 Encoding and Decoding
export const encodeBase64 = (data: Uint8Array) => Buffer.from(data).toString('base64');
export const decodeBase64 = (data: string) => Buffer.from(data, 'base64');

export function generateSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export async function generateEncryptionKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  // Encode password to ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);

  // Derive the key using PBKDF2
  const keyMaterial = await subtleCrypto.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return subtleCrypto.deriveKey(
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
}

/**
 * Returns a base64 encoded string of the encrypted message prepended with the iv.
 */
export async function encrypt(key: CryptoKey, input: string): Promise<IEncryptionResult> {
  // Generate a random initialization vector every time a message is encrypted
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the plaintext
  const encryptedBuffer = await subtleCrypto.encrypt(
    {
      name: PASSWORD_ENCRYPTION_ALGO,
      iv,
    },
    key,
    new TextEncoder().encode(input),
  );

  // Concatenate iv, and cipher-text
  const encryptedArray = new Uint8Array([...iv, ...new Uint8Array(encryptedBuffer)]);

  // Convert to base64
  return encodeBase64(encryptedArray);
}

export async function decrypt(
  key: CryptoKey,
  encryptionResult: IEncryptionResult,
): Promise<string> {
  // Decode from base64
  const encryptedArray = new Uint8Array(decodeBase64(encryptionResult));
  // Every encrypted data has its own IV
  const iv = encryptedArray.slice(0, IV_LENGTH);
  const ciphertext = encryptedArray.slice(IV_LENGTH);
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
  return new TextDecoder().decode(decryptedBuffer);
}

export async function exportEncryptionKey(encryptionKey: CryptoKey) {
  const exported = await subtleCrypto.exportKey('raw', encryptionKey);
  const key = new Uint8Array(exported);
  return key;
}

export async function importEncryptionKey(exportedKey: Uint8Array): Promise<CryptoKey> {
  const key = await subtleCrypto.importKey(
    'raw',
    exportedKey,
    { name: PASSWORD_ENCRYPTION_ALGO, length: 256 },
    IS_EXTRACTABLE,
    ['encrypt', 'decrypt'],
  );
  return key;
}

/**
 * Derive/import an AES-GCM key from an account secret key.
 * Uses SHA-256(secret[0..32]) as raw AES key material.
 */
export async function importAesKeyFromSecret(secret: Uint8Array | string): Promise<CryptoKey> {
  const secretBytes: Uint8Array = typeof secret === 'string'
    ? Uint8Array.from(secret.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    : secret;
  const seed = secretBytes.slice(0, 32);
  const digest = await (globalThis.crypto.subtle as SubtleCrypto).digest('SHA-256', seed);
  const keyBytes = new Uint8Array(digest);
  return importEncryptionKey(keyBytes);
}
