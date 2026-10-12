import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import {
  AES_GCM_TAG_LENGTH_BYTES,
  decodeBase64,
  decrypt,
  encodeBase64,
  encrypt,
  importEncryptionKey,
  IV_LENGTH,
} from './crypto';
import { waitBeforeKeyReadRetry } from './waitBeforeKeyReadRetry';

const MOBILE_KEY_LENGTH = 32;
/**
 * Waits (ms) before each retry of a key read that came back empty, 3 s in total.
 * The iOS plugin reads through KeychainSwift, which returns `nil` for any Keychain error and
 * sometimes instead of a stored value:
 * https://github.com/evgenyneu/keychain-swift#known-critical-issue---call-to-action
 * TODO: reconsider the secure storage plugin; one that rejects on read errors needs no retries.
 */
const KEY_READ_RETRY_DELAYS = [200, 400, 800, 1600];

let cachedKey: CryptoKey | null = null;
let pendingRead: Promise<CryptoKey | null> | null = null;
let pendingCreation: Promise<CryptoKey> | null = null;

/**
 * `encrypt()` returns base64 of `[iv(IV_LENGTH) || webCryptoGcmOutput]`, where
 * `webCryptoGcmOutput` is ciphertext + {@link AES_GCM_TAG_LENGTH_BYTES}-byte
 * tag (smallest Web Crypto output is tag-only for empty plaintext). Minimum
 * binary size is therefore IV + tag bytes; anything shorter in base64 cannot
 * be a blob from this pipeline.
 */
const MIN_CIPHERTEXT_BINARY_LENGTH = IV_LENGTH + AES_GCM_TAG_LENGTH_BYTES;
const MIN_CIPHERTEXT_BASE64_LENGTH = Math.ceil(MIN_CIPHERTEXT_BINARY_LENGTH / 3) * 4;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const HEX_RE = /^(?:0x)?[0-9a-fA-F]+$/;

/**
 * Heuristic: does `value` look like an AES-GCM ciphertext blob produced by
 * {@link encrypt}? Used to avoid double-encrypting input we cannot decrypt
 * with the current mobile key — that would turn a "key rotated / Keychain
 * rebuilt" scenario into permanent data loss, whereas leaving the original
 * blob intact at least preserves the possibility of recovery (and, in the
 * worst case, still fails loudly via the normal auth / decryption error
 * path).
 *
 * The plaintext blobs we actually migrate — BIP-39 mnemonic (spaces), hex
 * private keys, JSON-encoded preclaimed names (`{`/`[` / quotes), and
 * numeric secure-login timeouts — all fail this test, so legitimate
 * legacy plaintext is still encrypted as intended. Bare 64-char hex
 * strings (common private-key encoding) are a subset of the base64
 * alphabet, so the explicit {@link HEX_RE} exclusion is required to
 * avoid misclassifying them as ciphertext.
 */
function looksLikeCiphertext(value: string): boolean {
  if (HEX_RE.test(value)) return false;
  return (
    value.length >= MIN_CIPHERTEXT_BASE64_LENGTH
    && value.length % 4 === 0
    && BASE64_RE.test(value)
  );
}

/**
 * The key reads back empty while a wallet encrypted with it is stored. The iOS plugin
 * returns empty on any Keychain error, so this is most likely a failed read.
 */
export class MobileEncryptionKeyMissingError extends Error {
  constructor() {
    super('Mobile encryption key is missing while an encrypted wallet is stored');
    this.name = 'MobileEncryptionKeyMissingError';
  }
}

async function readStoredKey(): Promise<CryptoKey | null> {
  const existing = await SecureMobileStorage.get<string | null>(STORAGE_KEYS.mobileDataKey);
  if (typeof existing === 'string' && existing.length > 0) {
    return importEncryptionKey(new Uint8Array(decodeBase64(existing)));
  }
  return null;
}

async function isEncryptedWalletStored(): Promise<boolean> {
  // A failed read is not evidence that there is no wallet to protect.
  const stored = await SecureMobileStorage.get<string | null>(STORAGE_KEYS.mnemonic);
  return typeof stored === 'string' && looksLikeCiphertext(stored);
}

/** Resolves `null` when no key or encrypted wallet could be read; this does not prove absence. */
async function readStoredKeyWithRetries(
  retry = 0,
  wasWalletSeen = false,
): Promise<CryptoKey | null> {
  const storedKey = await readStoredKey();
  if (storedKey) {
    return storedKey;
  }
  // The wallet can read back empty too, so once seen it counts as stored.
  const isWalletStored = wasWalletSeen || await isEncryptedWalletStored();
  if (retry >= KEY_READ_RETRY_DELAYS.length) {
    if (isWalletStored) {
      throw new MobileEncryptionKeyMissingError();
    }
    return null;
  }
  await waitBeforeKeyReadRetry(KEY_READ_RETRY_DELAYS[retry]);
  return readStoredKeyWithRetries(retry + 1, isWalletStored);
}

async function readMobileEncryptionKey(): Promise<CryptoKey | null> {
  if (!IS_MOBILE_APP) {
    throw new Error('Mobile encryption keys must only be called on mobile');
  }
  if (cachedKey) return cachedKey;
  if (!pendingRead) pendingRead = readStoredKeyWithRetries();
  const read = pendingRead;
  try {
    const key = await read;
    if (key) cachedKey = key;
    return key;
  } finally {
    if (pendingRead === read) pendingRead = null;
  }
}

/** Startup, unlock and decryption must never create a key after an ambiguous read. */
export async function getMobileEncryptionKey(): Promise<CryptoKey> {
  if (pendingCreation) return pendingCreation;
  const key = await readMobileEncryptionKey();
  if (!key) throw new MobileEncryptionKeyMissingError();
  return key;
}

/**
 * For explicit wallet creation/import and migration of known legacy plaintext only.
 * iOS creates atomically: if the item already exists, use its key, never overwrite it.
 */
export async function getOrCreateMobileEncryptionKey(): Promise<CryptoKey> {
  if (pendingCreation) return pendingCreation;
  const key = await readMobileEncryptionKey();
  if (key) return key;
  if (!pendingCreation) {
    pendingCreation = (async () => {
      const rawBytes = globalThis.crypto.getRandomValues(new Uint8Array(MOBILE_KEY_LENGTH));
      const candidate = encodeBase64(rawBytes);
      const persisted = await SecureMobileStorage.getOrCreate(
        STORAGE_KEYS.mobileDataKey,
        candidate,
      );
      // Import the actual persisted value, which may be an existing key, only after success.
      cachedKey = await importEncryptionKey(new Uint8Array(decodeBase64(persisted)));
      return cachedKey;
    })();
  }
  const creation = pendingCreation;
  try {
    return await creation;
  } finally {
    if (pendingCreation === creation) pendingCreation = null;
  }
}

/**
 * Attempts to decrypt `value` with the mobile encryption key. Returns the
 * plaintext on success, or null if the value is not encrypted with this
 * key (i.e. it is either plaintext legacy state or corrupt ciphertext).
 *
 * Used by the mobile encryption migration to distinguish "already encrypted with my
 * key" (leave alone) from "plaintext, encrypt me" (migrate).
 */
export async function tryDecryptWithMobileKey(value: string): Promise<string | null> {
  try {
    const key = await getMobileEncryptionKey();
    return await decrypt(key, value);
  } catch {
    return null;
  }
}

/**
 * If `value` is already ciphertext produced by {@link getOrCreateMobileEncryptionKey},
 * returns it unchanged. If it looks like ciphertext but we cannot decrypt
 * it (most likely mobile-data-key rotation / corruption), also returns it
 * unchanged so we never destroy potentially-recoverable data by wrapping
 * unreadable ciphertext in another layer of encryption. Otherwise treats
 * `value` as legacy plaintext and encrypts it with the mobile key. Used
 * by the mobile encryption migration hooks on the mnemonic /
 * private-keys / preclaimed-names / secure-login-timeout storage refs.
 */
export async function encryptMobileStateIfPlaintext(value: string): Promise<string> {
  if (!value) return value;
  const decrypted = await tryDecryptWithMobileKey(value);
  if (decrypted !== null) return value;
  if (looksLikeCiphertext(value)) return value;
  let key: CryptoKey;
  try {
    key = await getOrCreateMobileEncryptionKey();
  } catch (error) {
    // Keep it as is until the key can be read; throwing here would stall the storage restore.
    if (error instanceof MobileEncryptionKeyMissingError) return value;
    throw error;
  }
  return encrypt(key, value);
}
