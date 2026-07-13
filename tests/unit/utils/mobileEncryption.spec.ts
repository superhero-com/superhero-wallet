// @ts-nocheck
/**
 * `mobileEncryption` exists to answer one question about a stored blob: "is this
 * already ciphertext I can read, or is it legacy plaintext that needs encrypting?"
 * That decision is driven by whether a REAL `decrypt()` succeeds and by whether the
 * value looks like REAL `encrypt()` output — so this spec runs the real AES-GCM
 * (`@/utils/crypto` over Node's WebCrypto) and the real `SecureMobileStorage`
 * (whose web implementation is plain `localStorage` — see `SecureStorageWeb`).
 *
 * A previous version mocked `@/utils/crypto`, replacing `encrypt` with
 * `` `encrypted:${value}` `` string concatenation. That made the tests vacuous: the
 * fake output is not even base64, so `looksLikeCiphertext()` — the heuristic that
 * prevents double-wrapping (and thus permanent data loss) — was never once evaluated
 * against a real ciphertext blob.
 *
 * The ONLY mock left is `IS_MOBILE_APP: true`, an environment fact that cannot be
 * derived in a jsdom test run (`process.env.PLATFORM` is unset).
 */
describe('mobileEncryption', () => {
  const loadModule = async ({ isMobileApp = true } = {}) => {
    vi.resetModules();
    vi.doMock('@/constants', async (importOriginal) => ({
      ...(await importOriginal()),
      IS_MOBILE_APP: isMobileApp,
    }));

    const mod = await import('@/utils/mobileEncryption');
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    return { ...mod, SecureMobileStorage };
  };

  /** Re-import with module state reset but storage retained — i.e. an app restart. */
  const restartApp = () => loadModule();

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('encryptMobileStateIfPlaintext', () => {
    it('encrypts legacy plaintext into real ciphertext that decrypts back to the original', async () => {
      const { encryptMobileStateIfPlaintext, tryDecryptWithMobileKey } = await loadModule();
      const plaintext = 'abandon abandon abandon about';

      const ciphertext = await encryptMobileStateIfPlaintext(plaintext);

      expect(ciphertext).not.toBe(plaintext);
      // Real round-trip through AES-GCM — the whole point of the module.
      await expect(tryDecryptWithMobileKey(ciphertext)).resolves.toBe(plaintext);
    });

    it('is idempotent: re-encrypting its own output returns it unchanged', async () => {
      const { encryptMobileStateIfPlaintext, tryDecryptWithMobileKey } = await loadModule();
      const plaintext = 'abandon abandon abandon about';

      const once = await encryptMobileStateIfPlaintext(plaintext);
      const twice = await encryptMobileStateIfPlaintext(once);

      expect(twice).toBe(once);
      await expect(tryDecryptWithMobileKey(twice)).resolves.toBe(plaintext);
    });

    it('passes empty values through untouched', async () => {
      const { encryptMobileStateIfPlaintext } = await loadModule();

      await expect(encryptMobileStateIfPlaintext('')).resolves.toBe('');
    });

    /**
     * The data-loss guard. After a Keychain wipe the old ciphertext is no longer
     * decryptable, but it must NOT be treated as plaintext and wrapped in a second
     * layer of encryption — that would destroy any chance of recovery. This only
     * means something when `looksLikeCiphertext()` is fed a genuine `encrypt()` blob,
     * which is exactly what the previously-mocked crypto made impossible to check.
     */
    it('leaves ciphertext from a rotated/wiped key unchanged instead of double-wrapping it', async () => {
      const first = await loadModule();
      const ciphertext = await first.encryptMobileStateIfPlaintext('critical seed phrase');

      // Simulate a Keychain wipe: drop the mobile key, keep the encrypted blob.
      await first.SecureMobileStorage.remove('mobile-data-key');

      const afterWipe = await restartApp();
      // The new install mints a different key, so this blob is undecryptable now...
      await expect(afterWipe.tryDecryptWithMobileKey(ciphertext)).resolves.toBeNull();
      // ...and must therefore be returned untouched, not re-encrypted.
      await expect(afterWipe.encryptMobileStateIfPlaintext(ciphertext)).resolves.toBe(ciphertext);
    });

    it('does not misclassify a 64-char hex private key as ciphertext', async () => {
      const { encryptMobileStateIfPlaintext, tryDecryptWithMobileKey } = await loadModule();
      // 64 hex chars are a subset of the base64 alphabet and satisfy the length /
      // modulo-4 checks, so without the explicit hex exclusion this would be
      // mistaken for ciphertext and silently left unencrypted.
      const hexPrivateKey = 'a'.repeat(64);

      const result = await encryptMobileStateIfPlaintext(hexPrivateKey);

      expect(result).not.toBe(hexPrivateKey);
      await expect(tryDecryptWithMobileKey(result)).resolves.toBe(hexPrivateKey);
    });

    it('encrypts base64-shaped plaintext that is too short to be a real ciphertext', async () => {
      const { encryptMobileStateIfPlaintext, tryDecryptWithMobileKey } = await loadModule();
      // 40 chars — below the 44-char minimum for base64(16-byte IV + 16-byte GCM tag).
      const shortBase64Shaped = `${'Q'.repeat(38)}==`;

      const result = await encryptMobileStateIfPlaintext(shortBase64Shaped);

      expect(result).not.toBe(shortBase64Shaped);
      await expect(tryDecryptWithMobileKey(result)).resolves.toBe(shortBase64Shaped);
    });
  });

  describe('tryDecryptWithMobileKey', () => {
    it('returns null for values that are not decryptable with the mobile key', async () => {
      const { tryDecryptWithMobileKey } = await loadModule();

      await expect(tryDecryptWithMobileKey('plain text, not ciphertext')).resolves.toBeNull();
      await expect(tryDecryptWithMobileKey(`${'A'.repeat(42)}==`)).resolves.toBeNull();
    });
  });

  describe('getOrCreateMobileEncryptionKey', () => {
    it('refuses to mint a key when not running as the mobile app', async () => {
      const { getOrCreateMobileEncryptionKey } = await loadModule({ isMobileApp: false });

      await expect(getOrCreateMobileEncryptionKey()).rejects.toThrow(/only be called on mobile/);
    });

    it('persists the key once, reuses it in-memory, and reloads it after a restart', async () => {
      const {
        getOrCreateMobileEncryptionKey,
        encryptMobileStateIfPlaintext,
        SecureMobileStorage,
      } = await loadModule();
      const setSpy = vi.spyOn(SecureMobileStorage, 'set');

      const key = await getOrCreateMobileEncryptionKey();
      expect(key.algorithm.name).toBe('AES-GCM');

      // Second call is served from the in-memory cache — no extra Keychain write.
      await expect(getOrCreateMobileEncryptionKey()).resolves.toBe(key);
      expect(setSpy).toHaveBeenCalledTimes(1);

      // The SAME key material must come back after a restart, or data encrypted in
      // this session would be unreadable in the next one.
      const ciphertext = await encryptMobileStateIfPlaintext('survives restart');
      const restarted = await restartApp();
      await expect(restarted.tryDecryptWithMobileKey(ciphertext)).resolves.toBe('survives restart');
    });

    /**
     * Persist-before-cache. If a failed Keychain write still published the key into
     * the module cache, that key would encrypt fresh state and then vanish on restart,
     * making the state permanently unrecoverable.
     */
    it('does not cache an un-persisted key when the Keychain write fails', async () => {
      const {
        getOrCreateMobileEncryptionKey,
        encryptMobileStateIfPlaintext,
        SecureMobileStorage,
      } = await loadModule();
      const setSpy = vi.spyOn(SecureMobileStorage, 'set')
        .mockRejectedValueOnce(new Error('keychain locked'));

      await expect(getOrCreateMobileEncryptionKey()).rejects.toThrow('keychain locked');

      // A retry mints a fresh key and persists it for real (spy falls through).
      const key = await getOrCreateMobileEncryptionKey();
      expect(key.algorithm.name).toBe('AES-GCM');
      expect(setSpy).toHaveBeenCalledTimes(2);

      // Whatever key we ended up holding must be the one on disk: anything encrypted
      // now has to still be readable after a restart.
      const ciphertext = await encryptMobileStateIfPlaintext('must survive');
      const restarted = await restartApp();
      await expect(restarted.tryDecryptWithMobileKey(ciphertext)).resolves.toBe('must survive');
    });
  });
});
