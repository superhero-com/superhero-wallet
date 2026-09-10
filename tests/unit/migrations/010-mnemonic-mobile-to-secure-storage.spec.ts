// @ts-nocheck
/**
 * `010-mnemonic-mobile-to-secure-storage` moves a mobile mnemonic that still
 * lives in the plain `WalletStorage` (pre-migration location) into
 * `SecureMobileStorage` (Keychain/Keystore). Real storage is used throughout -
 * `SecureMobileStorage`'s web fallback is plain `localStorage`, same as
 * `WalletStorage`, but under a different key namespace, so a real move is
 * observable without mocking either module.
 */
import { STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import migration from '@/migrations/010-mnemonic-mobile-to-secure-storage';

const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('migration 010: mnemonic mobile to secure storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('moves a mnemonic found in legacy WalletStorage into SecureMobileStorage and removes the old copy', async () => {
    WalletStorage.set(STORAGE_KEYS.mnemonic, VALID_MNEMONIC);

    const result = await migration(null);

    expect(result).toBe(VALID_MNEMONIC);
    expect(WalletStorage.get(STORAGE_KEYS.mnemonic)).toBeNull();
    await expect(SecureMobileStorage.get(STORAGE_KEYS.mnemonic)).resolves.toBe(VALID_MNEMONIC);
  });

  it('passes the already-restored value through when there is nothing left in legacy WalletStorage', async () => {
    const result = await migration(VALID_MNEMONIC);
    expect(result).toBe(VALID_MNEMONIC);
  });

  it('returns null unchanged when there is no legacy mnemonic and nothing was restored', async () => {
    const result = await migration(null);
    expect(result).toBeNull();
  });

  it('prefers the legacy WalletStorage mnemonic over an already-restored value when both exist', async () => {
    // Documents current behavior: if a legacy copy still lingers in WalletStorage
    // for any reason, this migration always wins with it, even if a (potentially
    // different/newer) value was already restored from SecureMobileStorage.
    WalletStorage.set(STORAGE_KEYS.mnemonic, VALID_MNEMONIC);
    const alreadyRestored = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

    const result = await migration(alreadyRestored);

    expect(result).toBe(VALID_MNEMONIC);
  });
});
