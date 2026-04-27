// @ts-nocheck
describe('mobileEncryption', () => {
  const secureStoreMock = new Map<string, any>();
  const secureMobileStorageMock = {
    get: jest.fn((key: string) => Promise.resolve(secureStoreMock.get(key) ?? null)),
    set: jest.fn((key: string, value: any) => {
      secureStoreMock.set(key, value);
      return Promise.resolve();
    }),
  };
  const decryptMock = jest.fn();
  const encryptMock = jest.fn();
  const importEncryptionKeyMock = jest.fn();
  const getRandomValuesMock = jest.fn((bytes: Uint8Array) => {
    bytes.fill(7);
    return bytes;
  });

  const loadModule = () => {
    jest.resetModules();
    secureStoreMock.clear();
    secureMobileStorageMock.get.mockClear();
    secureMobileStorageMock.set.mockClear();
    decryptMock.mockReset();
    encryptMock.mockReset();
    importEncryptionKeyMock.mockReset();
    getRandomValuesMock.mockClear();

    jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(getRandomValuesMock);

    importEncryptionKeyMock.mockImplementation(async (bytes: Uint8Array) => ({
      byteLength: bytes.length,
    }));
    encryptMock.mockImplementation(async (_key, value) => `encrypted:${value}`);

    jest.doMock('@/constants', () => ({
      IS_MOBILE_APP: true,
      STORAGE_KEYS: { mobileDataKey: 'mobile-data-key' },
    }));
    jest.doMock('@/lib/SecureMobileStorage', () => ({
      SecureMobileStorage: secureMobileStorageMock,
    }));
    jest.doMock('@/utils/crypto', () => ({
      decodeBase64: (value: string) => Buffer.from(value, 'base64'),
      decrypt: decryptMock,
      encodeBase64: (bytes: Uint8Array) => Buffer.from(bytes).toString('base64'),
      encrypt: encryptMock,
      importEncryptionKey: importEncryptionKeyMock,
    }));

    // eslint-disable-next-line global-require
    return require('@/utils/mobileEncryption');
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('encrypts legacy plaintext with the per-install mobile key', async () => {
    const { encryptMobileStateIfPlaintext } = loadModule();
    decryptMock.mockRejectedValue(new Error('not ciphertext'));

    await expect(encryptMobileStateIfPlaintext('seed words here')).resolves.toBe(
      'encrypted:seed words here',
    );

    expect(secureMobileStorageMock.set).toHaveBeenCalledWith(
      'mobile-data-key',
      Buffer.from(new Uint8Array(32).fill(7)).toString('base64'),
    );
    expect(encryptMock).toHaveBeenCalledWith(expect.any(Object), 'seed words here');
  });

  it('leaves ciphertext encrypted with the current mobile key unchanged', async () => {
    const { encryptMobileStateIfPlaintext } = loadModule();
    decryptMock.mockResolvedValue('plain text');

    await expect(encryptMobileStateIfPlaintext('current-ciphertext')).resolves.toBe(
      'current-ciphertext',
    );

    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('leaves unreadable ciphertext-shaped values unchanged to avoid double wrapping', async () => {
    const { encryptMobileStateIfPlaintext } = loadModule();
    decryptMock.mockRejectedValue(new Error('wrong key'));
    const ciphertextShaped = `${'A'.repeat(38)}==`;

    await expect(encryptMobileStateIfPlaintext(ciphertextShaped)).resolves.toBe(ciphertextShaped);

    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('does not misclassify hex private keys as ciphertext', async () => {
    const { encryptMobileStateIfPlaintext } = loadModule();
    decryptMock.mockRejectedValue(new Error('not ciphertext'));
    const hexPrivateKey = 'a'.repeat(64);

    await expect(encryptMobileStateIfPlaintext(hexPrivateKey)).resolves.toBe(
      `encrypted:${hexPrivateKey}`,
    );

    expect(encryptMock).toHaveBeenCalledWith(expect.any(Object), hexPrivateKey);
  });

  it('documents that long base64-shaped legacy plaintext is preserved by the heuristic', async () => {
    const { encryptMobileStateIfPlaintext } = loadModule();
    decryptMock.mockRejectedValue(new Error('wrong key'));
    const base64ShapedPlaintext = `${'Q'.repeat(38)}==`;

    await expect(encryptMobileStateIfPlaintext(base64ShapedPlaintext)).resolves.toBe(
      base64ShapedPlaintext,
    );

    expect(encryptMock).not.toHaveBeenCalled();
  });

  it('does not cache a newly generated key when persisting it fails', async () => {
    const { getOrCreateMobileEncryptionKey } = loadModule();
    secureMobileStorageMock.set
      .mockRejectedValueOnce(new Error('keychain locked'))
      .mockImplementationOnce((key: string, value: any) => {
        secureStoreMock.set(key, value);
        return Promise.resolve();
      });

    await expect(getOrCreateMobileEncryptionKey()).rejects.toThrow('keychain locked');
    await expect(getOrCreateMobileEncryptionKey()).resolves.toEqual({ byteLength: 32 });

    expect(importEncryptionKeyMock).toHaveBeenCalledTimes(2);
    expect(secureMobileStorageMock.set).toHaveBeenCalledTimes(2);
  });
});
