import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { encodeBase64 } from '@/utils/crypto';
import { ensureVaultReady, refreshVault } from '@/lib/WalletVault';

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
 * never reaches the user. `setPassword` stores it with its salt.
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
