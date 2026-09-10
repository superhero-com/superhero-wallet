// @ts-nocheck
/**
 * `011-mobile-sensitive-data-encryption` is a thin gate in front of
 * `encryptMobileStateIfPlaintext` (already exhaustively covered by
 * `tests/unit/utils/mobileEncryption.spec.ts`, including the double-encryption
 * and plaintext-misclassification edge cases). This spec only covers the
 * gate's own responsibility: deciding WHEN to delegate at all.
 */
describe('migration 011: mobile sensitive data encryption', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  async function loadMigration({ isMobileApp } = { isMobileApp: true }) {
    vi.doMock('@/constants', async (importOriginal) => ({
      ...(await importOriginal()),
      IS_MOBILE_APP: isMobileApp,
    }));
    const { default: migration } = await import('@/migrations/011-mobile-sensitive-data-encryption');
    return migration;
  }

  it('is a no-op on extension/web builds, even for plaintext-looking values', async () => {
    const migration = await loadMigration({ isMobileApp: false });
    const plaintext = 'abandon abandon abandon about';

    const result = await migration(plaintext);

    expect(result).toBe(plaintext);
  });

  it('passes null through untouched on mobile (nothing to encrypt yet)', async () => {
    const migration = await loadMigration();
    await expect(migration(null)).resolves.toBeNull();
  });

  it('passes an empty string through untouched on mobile', async () => {
    const migration = await loadMigration();
    await expect(migration('')).resolves.toBe('');
  });

  it('does not attempt to encrypt non-string restored values (e.g. an object)', async () => {
    const migration = await loadMigration();
    const obj = { some: 'preclaimed-name-record' };

    // @ts-expect-error - exercising a defensive branch with a non-string input
    const result = await migration(obj);

    expect(result).toBe(obj);
  });

  it('delegates to the real mobile encryption pipeline for plaintext on mobile', async () => {
    const migration = await loadMigration();
    const plaintext = 'abandon abandon abandon about';

    const result = await migration(plaintext);

    expect(result).not.toBe(plaintext);
    const { tryDecryptWithMobileKey } = await import('@/utils/mobileEncryption');
    await expect(tryDecryptWithMobileKey(result)).resolves.toBe(plaintext);
  });
});
