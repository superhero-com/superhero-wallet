import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { encodeBase64 } from '@/utils/crypto';
import {
  ensureVaultReady,
  readVault,
  refreshVault,
  writeVaultField,
  VaultConflictError,
} from '@/lib/WalletVault';

/**
 * Legacy hardcoded "skip password" sentinel, kept only as a
 * migration fallback. Wallets created with the old default-password flow have their mnemonic
 * AES-GCM-encrypted with the PBKDF2 derivation of this exact string, and
 * on first launch after the upgrade we need to unlock them somehow before
 * we can re-key them. Do not reference this constant anywhere else.
 *
 * @deprecated Legacy unlock fallback in `useAuth`; new installs never use this value.
 */
export const LEGACY_DEFAULT_PASSWORD = 'testPassword123';

const storage = IS_MOBILE_APP ? SecureMobileStorage : WalletStorage;

/**
 * 32-byte (256-bit) random secret, base64 encoded. Provides 256 bits of
 * entropy — far beyond any practical brute force — which is what we want
 * here because this value IS the "password" in default-password mode and
 * never reaches the user.
 */
export function generateDefaultPasswordSecret(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return encodeBase64(bytes);
}

/**
 * Returns the per-install default-password secret, or null if the user
 * has never entered default-password mode on this install.
 */
export async function getDefaultPasswordSecret(): Promise<string | null> {
  if (!IS_MOBILE_APP) {
    await ensureVaultReady();
    await refreshVault();
  }
  const value = await storage.get<string | null>(STORAGE_KEYS.defaultPasswordSecret);
  return (typeof value === 'string' && value.length > 0) ? value : null;
}

let pendingCreate: Promise<string> | null = null;

/**
 * Returns the per-install default-password secret, generating and
 * persisting a fresh one if it does not yet exist. Callers should treat
 * the returned string as the "password" in places that previously used
 * the hardcoded `STUB_ACCOUNT.password`.
 *
 * Concurrent callers share a single in-flight creation promise so that
 * two overlapping calls never mint divergent secrets (TOCTOU). The slot is
 * cleared when that promise settles (success or failure) so a later call
 * can retry after a storage error without being tied to the rejected
 * promise instance beyond its settlement.
 */
export async function getOrCreateDefaultPasswordSecret(): Promise<string> {
  if (!pendingCreate) {
    pendingCreate = (async () => {
      if (!IS_MOBILE_APP) {
        await ensureVaultReady();
        for (let attempt = 0; attempt < 10; attempt += 1) {
          // eslint-disable-next-line no-await-in-loop
          await refreshVault();
          const snapshot = readVault();
          const existing = snapshot.values[STORAGE_KEYS.defaultPasswordSecret];
          if (existing) return existing;
          const secret = generateDefaultPasswordSecret();
          try {
            // eslint-disable-next-line no-await-in-loop
            await writeVaultField(STORAGE_KEYS.defaultPasswordSecret, secret, snapshot);
            return secret;
          } catch (error) {
            if (!(error instanceof VaultConflictError)) throw error;
          }
        }
        throw new VaultConflictError();
      }
      const existing = await getDefaultPasswordSecret();
      if (existing) {
        return existing;
      }
      const secret = generateDefaultPasswordSecret();
      await storage.set(STORAGE_KEYS.defaultPasswordSecret, secret);
      return secret;
    })().finally(() => {
      pendingCreate = null;
    });
  }
  return pendingCreate;
}
