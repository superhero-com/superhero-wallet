import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import {
  decodeBase64,
  decrypt,
  encodeBase64,
  encrypt,
  importEncryptionKey,
} from './crypto';

const MOBILE_KEY_LENGTH = 32;

let cachedKey: CryptoKey | null = null;
let pending: Promise<CryptoKey> | null = null;

/**
 * Mobile-only, per-install AES-GCM key that encrypts sensitive
 * state at rest on top of the platform Keychain.
 *
 * Previously mobile state was stored as plaintext inside SecureMobileStorage
 * (the iOS Keychain / Android Keystore). Platform Keychain *is* a secure
 * at-rest store, but shipping app-level encryption on top means an attacker
 * must exfiltrate both the data blob AND the mobile-data-key blob — and
 * lays the groundwork for future biometric-bound key derivation.
 *
 * The key itself is generated once per install from `crypto.getRandomValues`
 * and persisted (raw bytes, base64) under `STORAGE_KEYS.mobileDataKey`.
 * Subsequent calls re-import it via `importEncryptionKey`, caching in-memory
 * to avoid repeated Keychain round-trips.
 */
export async function getOrCreateMobileEncryptionKey(): Promise<CryptoKey> {
  if (!IS_MOBILE_APP) {
    throw new Error('getOrCreateMobileEncryptionKey() must only be called on mobile');
  }
  if (cachedKey) return cachedKey;
  if (pending) return pending;

  pending = (async () => {
    const existing = await SecureMobileStorage.get<string | null>(STORAGE_KEYS.mobileDataKey);
    if (typeof existing === 'string' && existing.length > 0) {
      const keyBytes = new Uint8Array(decodeBase64(existing));
      cachedKey = await importEncryptionKey(keyBytes);
      return cachedKey;
    }
    const rawBytes = globalThis.crypto.getRandomValues(new Uint8Array(MOBILE_KEY_LENGTH));
    const importedKey = await importEncryptionKey(rawBytes);
    /**
     * Persist BEFORE publishing the key into the module cache.
     * If the Keychain write fails (rejects, device locked on iOS,
     * out-of-quota, etc.), the caller will see the rejection and retry,
     * while subsequent in-process callers will re-enter this branch and
     * mint a new key instead of handing out the un-persisted one. A
     * cached-but-unpersisted key would survive in memory just long
     * enough to encrypt fresh state, then disappear at app restart —
     * rendering that state permanently unrecoverable.
     */
    await SecureMobileStorage.set(STORAGE_KEYS.mobileDataKey, encodeBase64(rawBytes));
    cachedKey = importedKey;
    return cachedKey;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
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
    const key = await getOrCreateMobileEncryptionKey();
    return await decrypt(key, value);
  } catch {
    return null;
  }
}

/**
 * AES-GCM ciphertext as emitted by `crypto.encrypt()` is the base64 of
 * `[iv(12) || ciphertext(>=1) || tag(16)]`, so the smallest legal ciphertext
 * is 29 bytes → 40 base64 chars (with padding). Anything shorter is definitely
 * not a ciphertext blob from this pipeline.
 */
const MIN_CIPHERTEXT_BASE64_LENGTH = 40;
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
  const key = await getOrCreateMobileEncryptionKey();
  return encrypt(key, value);
}
