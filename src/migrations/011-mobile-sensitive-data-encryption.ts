import type { Migration } from '@/types';
import { IS_MOBILE_APP } from '@/constants';

/**
 * Pre-upgrade mobile state was stored as plaintext inside
 * SecureMobileStorage. Starting with this release every sensitive blob
 * is AES-GCM encrypted with a per-install mobile-data-key, so on first
 * launch after upgrade we transparently re-encrypt any plaintext we find.
 *
 * Attached as a migration step on every sensitive `useStorageRef` call
 * whose underlying storage can hold legacy plaintext: mnemonic, imported
 * account private keys, preclaimed names, secure-login timeout. The
 * detection is robust: we try to decrypt with the mobile key, and only
 * encrypt when decryption fails (meaning the value is either plaintext
 * or ciphertext from a different key — the latter being unrecoverable
 * and treated like plaintext for our purposes).
 *
 * No-op on extension / web where `IS_MOBILE_APP === false`. The
 * `mobileEncryption` utility (and its transitive Capacitor native
 * plugin dependency) is imported lazily so that pulling this migration
 * into shared composables — e.g. `useAeNames` — does not force a
 * Capacitor module load on the extension/web build or in the Jest test
 * runner (which has no Capacitor host).
 */
const migration: Migration<string | null> = async (restored) => {
  if (!IS_MOBILE_APP || typeof restored !== 'string' || restored.length === 0) {
    return restored;
  }
  const { encryptMobileStateIfPlaintext } = await import('@/utils/mobileEncryption');
  return encryptMobileStateIfPlaintext(restored);
};

export default migration;
