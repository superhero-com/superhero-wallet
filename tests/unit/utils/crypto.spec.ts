// @ts-nocheck
import {
  AES_GCM_TAG_LENGTH_BYTES,
  decodeBase64,
  decrypt,
  encodeBase64,
  encrypt,
  generateEncryptionKey,
  generateSalt,
  IV_LENGTH,
} from '@/utils/crypto';

/**
 * The wallet's encryption core: PBKDF2 password -> AES-GCM key, and the
 * encrypt/decrypt used for the mnemonic, imported private keys and other secrets
 * at rest. Runs against REAL WebCrypto — no mocks — so these assertions pin the
 * actual cryptographic guarantees, not a stand-in.
 *
 * The properties below are the ones whose silent failure would compromise the
 * wallet: a wrong password must THROW rather than yield garbage plaintext, the IV
 * must be fresh per message (or identical secrets become linkable), and tampered
 * ciphertext must be rejected by the GCM auth tag rather than decrypted.
 */
const PASSWORD = 'correct horse battery staple';
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('utils/crypto', () => {
  let salt: Uint8Array;
  let key: CryptoKey;

  beforeAll(async () => {
    salt = generateSalt();
    key = await generateEncryptionKey(PASSWORD, salt);
  });

  describe('generateSalt', () => {
    it('returns 16 fresh random bytes each call', () => {
      const a = generateSalt();
      const b = generateSalt();

      expect(a).toBeInstanceOf(Uint8Array);
      expect(a).toHaveLength(16);
      expect(encodeBase64(a)).not.toBe(encodeBase64(b));
    });
  });

  describe('generateEncryptionKey', () => {
    it('derives a 256-bit AES-GCM key usable for encrypt and decrypt', () => {
      expect(key.algorithm.name).toBe('AES-GCM');
      expect(key.algorithm.length).toBe(256);
      expect(key.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
    });

    it('is deterministic: the same password + salt re-derives a key that decrypts', async () => {
      const ciphertext = await encrypt(key, MNEMONIC);
      const rederived = await generateEncryptionKey(PASSWORD, salt);

      await expect(decrypt(rederived, ciphertext)).resolves.toBe(MNEMONIC);
    });

    it('salts the derivation: the same password + a different salt cannot decrypt', async () => {
      const ciphertext = await encrypt(key, MNEMONIC);
      const otherSaltKey = await generateEncryptionKey(PASSWORD, generateSalt());

      // Must REJECT — never resolve to garbage plaintext.
      await expect(decrypt(otherSaltKey, ciphertext)).rejects.toThrow();
    });
  });

  describe('encrypt / decrypt round-trip', () => {
    it.each([
      ['a BIP-39 mnemonic', MNEMONIC],
      ['a hex private key', 'a'.repeat(64)],
      ['JSON state', '{"names":["foo.chain"],"n":1}'],
      ['unicode', '助记词 🔐 ünïcødé'],
      ['an empty string', ''],
      ['a long blob', 'x'.repeat(10_000)],
    ])('round-trips %s', async (_label, plaintext) => {
      const ciphertext = await encrypt(key, plaintext);

      expect(ciphertext).not.toBe(plaintext);
      await expect(decrypt(key, ciphertext)).resolves.toBe(plaintext);
    });
  });

  describe('ciphertext shape', () => {
    it('is base64 of [16-byte IV || ciphertext+16-byte GCM tag]', async () => {
      const ciphertext = await encrypt(key, '');
      const bytes = new Uint8Array(decodeBase64(ciphertext));

      expect(ciphertext).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      // Encrypting an empty string yields IV + tag only — the minimum possible blob.
      expect(bytes).toHaveLength(IV_LENGTH + AES_GCM_TAG_LENGTH_BYTES);
    });

    /**
     * Reusing an IV under the same AES-GCM key is catastrophic (it leaks the XOR of
     * the plaintexts and can expose the auth key). Encrypting identical plaintext
     * twice must therefore never produce identical output.
     */
    it('uses a fresh random IV per message, so identical plaintext encrypts differently', async () => {
      const first = await encrypt(key, MNEMONIC);
      const second = await encrypt(key, MNEMONIC);

      expect(first).not.toBe(second);

      const ivOf = (blob: string) => (
        encodeBase64(new Uint8Array(decodeBase64(blob)).slice(0, IV_LENGTH))
      );
      expect(ivOf(first)).not.toBe(ivOf(second));

      // Both still decrypt back to the same secret.
      await expect(decrypt(key, first)).resolves.toBe(MNEMONIC);
      await expect(decrypt(key, second)).resolves.toBe(MNEMONIC);
    });
  });

  describe('decrypt rejects rather than returning garbage', () => {
    it('rejects a wrong password (this is what makes a wrong password detectable)', async () => {
      const ciphertext = await encrypt(key, MNEMONIC);
      const wrongKey = await generateEncryptionKey('wrong password', salt);

      await expect(decrypt(wrongKey, ciphertext)).rejects.toThrow();
    });

    it('rejects ciphertext whose body has been tampered with (GCM auth tag)', async () => {
      const bytes = new Uint8Array(decodeBase64(await encrypt(key, MNEMONIC)));
      // Mutate a byte past the IV — i.e. inside the ciphertext/tag region.
      bytes[IV_LENGTH + 1] = (bytes[IV_LENGTH + 1] + 1) % 256;

      await expect(decrypt(key, encodeBase64(bytes))).rejects.toThrow();
    });

    it('rejects ciphertext whose IV has been tampered with', async () => {
      const bytes = new Uint8Array(decodeBase64(await encrypt(key, MNEMONIC)));
      bytes[0] = (bytes[0] + 1) % 256;

      await expect(decrypt(key, encodeBase64(bytes))).rejects.toThrow();
    });

    it.each([
      ['plain text that is not a blob', 'not ciphertext at all'],
      ['an empty string', ''],
      ['a truncated blob', 'AAAA'],
    ])('rejects %s', async (_label, value) => {
      await expect(decrypt(key, value)).rejects.toThrow();
    });
  });
});

/**
 * `IS_EXTRACTABLE` is derived from `IS_EXTENSION` at module load: the extension needs
 * to export the raw key to persist it in `browser.storage.session` so the background /
 * offscreen pages can reuse it, while other platforms deliberately keep the key
 * non-extractable. `IS_EXTENSION` is false under vitest, hence the module reload.
 */
describe('utils/crypto — extension session-key export', () => {
  const loadCrypto = async ({ isExtension }: { isExtension: boolean }) => {
    vi.resetModules();
    vi.doMock('@/constants', async (importOriginal) => ({
      ...(await importOriginal()),
      IS_EXTENSION: isExtension,
    }));
    return import('@/utils/crypto');
  };

  afterEach(() => {
    vi.resetModules();
  });

  it('exports the raw key and re-imports it into one that decrypts the same data', async () => {
    const crypto = await loadCrypto({ isExtension: true });
    const extKey = await crypto.generateEncryptionKey(PASSWORD, crypto.generateSalt());
    const ciphertext = await crypto.encrypt(extKey, MNEMONIC);

    const raw = await crypto.exportEncryptionKey(extKey);
    expect(raw).toBeInstanceOf(Uint8Array);
    expect(raw).toHaveLength(32); // AES-256

    // Round-trip through the raw bytes, exactly as the session-storage handoff does.
    const reimported = await crypto.importEncryptionKey(raw);
    await expect(crypto.decrypt(reimported, ciphertext)).resolves.toBe(MNEMONIC);
  });

  it('keeps the key non-extractable off-extension, so it cannot leak via export', async () => {
    const crypto = await loadCrypto({ isExtension: false });
    const nonExtractableKey = await crypto.generateEncryptionKey(PASSWORD, crypto.generateSalt());

    expect(nonExtractableKey.extractable).toBe(false);
    await expect(crypto.exportEncryptionKey(nonExtractableKey)).rejects.toThrow();
  });
});
