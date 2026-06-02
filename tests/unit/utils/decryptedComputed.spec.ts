// @ts-nocheck
const mockSubtleDecrypt = vi.fn();
const mockSubtleEncrypt = vi.fn();
const mockGetRandomValues = vi.fn((bytes: Uint8Array) => {
  bytes.fill(0);
  return bytes;
});

async function loadModule() {
  vi.resetModules();
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      ...globalThis.crypto,
      getRandomValues: mockGetRandomValues,
      subtle: {
        decrypt: (...args) => mockSubtleDecrypt(...args),
        encrypt: (...args) => mockSubtleEncrypt(...args),
      },
    },
  });
  return {
    // eslint-disable-next-line global-require
    ...(await import('vue')),
    // eslint-disable-next-line global-require
    ...(await import('@/utils/common')),
  };
}

function ciphertext(label: string) {
  return Buffer.concat([Buffer.alloc(16), Buffer.from(label)]).toString('base64');
}

async function flushWatchers(nextTick) {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

describe('decryptedComputed', () => {
  const oldKey = { id: 'old-key' };
  const newKey = { id: 'new-key' };
  let warnSpy;

  beforeEach(async () => {
    mockSubtleDecrypt.mockReset();
    mockSubtleEncrypt.mockReset();
    mockGetRandomValues.mockClear();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    warnSpy.mockRestore();
  });

  it('re-encrypts persisted state when the key changes', async () => {
    const { decryptedComputed, nextTick, ref } = await loadModule();
    const key = ref(oldKey);
    const encryptedState = ref(ciphertext('old-ciphertext'));
    const decrypted = decryptedComputed(key, encryptedState, '');

    mockSubtleDecrypt.mockImplementation(async (_algorithm, usedKey, encryptedBytes) => {
      const label = Buffer.from(encryptedBytes).toString();
      if (usedKey.id === oldKey.id && label === 'old-ciphertext') {
        return new TextEncoder().encode('secret');
      }
      if (usedKey.id === newKey.id && label === 'new-ciphertext') {
        return new TextEncoder().encode('secret');
      }
      throw new Error('unexpected decrypt');
    });
    mockSubtleEncrypt.mockResolvedValue(Buffer.from('new-ciphertext'));

    await flushWatchers(nextTick);
    key.value = newKey;
    await flushWatchers(nextTick);

    expect(decrypted.value).toBe('secret');
    expect(mockSubtleEncrypt).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ id: newKey.id }),
      new TextEncoder().encode('secret'),
    );
    expect(encryptedState.value).toBe(ciphertext('new-ciphertext'));
  });

  it('recovers when state is already encrypted with the new key during rotation', async () => {
    const { decryptedComputed, nextTick, ref } = await loadModule();
    const key = ref(oldKey);
    const encryptedState = ref(ciphertext('old-ciphertext'));
    const onDecrypted = vi.fn();
    const decrypted = decryptedComputed(key, encryptedState, '', { onDecrypted });

    mockSubtleDecrypt.mockImplementation(async (_algorithm, usedKey, encryptedBytes) => {
      const label = Buffer.from(encryptedBytes).toString();
      if (usedKey.id === oldKey.id && label === 'old-ciphertext') {
        return new TextEncoder().encode('secret');
      }
      if (usedKey.id === oldKey.id && label === 'new-ciphertext') {
        throw new Error('ciphertext already rotated');
      }
      if (usedKey.id === newKey.id && label === 'new-ciphertext') {
        return new TextEncoder().encode('secret');
      }
      throw new Error('unexpected decrypt');
    });
    mockSubtleEncrypt.mockResolvedValue(Buffer.from('should-not-overwrite'));

    await flushWatchers(nextTick);
    key.value = newKey;
    encryptedState.value = ciphertext('new-ciphertext');
    await flushWatchers(nextTick);

    expect(decrypted.value).toBe('secret');
    expect(onDecrypted).toHaveBeenLastCalledWith('secret');
    expect(mockSubtleEncrypt).not.toHaveBeenCalled();
    expect(encryptedState.value).toBe(ciphertext('new-ciphertext'));
  });

  it('clears stale local plaintext without overwriting storage when decryption is unrecoverable', async () => {
    const { decryptedComputed, nextTick, ref } = await loadModule();
    const key = ref(oldKey);
    const encryptedState = ref(ciphertext('old-ciphertext'));
    const decrypted = decryptedComputed(key, encryptedState, 'default');

    mockSubtleDecrypt.mockImplementation(async (_algorithm, usedKey, encryptedBytes) => {
      const label = Buffer.from(encryptedBytes).toString();
      if (usedKey.id === oldKey.id && label === 'old-ciphertext') {
        return new TextEncoder().encode('secret');
      }
      throw new Error('unreadable');
    });
    mockSubtleEncrypt.mockResolvedValue(Buffer.from('should-not-overwrite'));

    await flushWatchers(nextTick);
    key.value = newKey;
    encryptedState.value = ciphertext('unreadable-ciphertext');
    await flushWatchers(nextTick);

    expect(decrypted.value).toBe('default');
    expect(mockSubtleEncrypt).not.toHaveBeenCalled();
    expect(encryptedState.value).toBe(ciphertext('unreadable-ciphertext'));
  });

  it('continues reacting to external storage changes after an encrypt failure', async () => {
    const { decryptedComputed, nextTick, ref } = await loadModule();
    const key = ref(newKey);
    const encryptedState = ref(ciphertext('initial-ciphertext'));
    const decrypted = decryptedComputed(key, encryptedState, 'default');

    mockSubtleDecrypt.mockImplementation(async (_algorithm, usedKey, encryptedBytes) => {
      const label = Buffer.from(encryptedBytes).toString();
      if (usedKey.id === newKey.id && label === 'initial-ciphertext') {
        return new TextEncoder().encode('initial');
      }
      if (usedKey.id === newKey.id && label === 'external-ciphertext') {
        return new TextEncoder().encode('external');
      }
      throw new Error('unexpected decrypt');
    });
    mockSubtleEncrypt.mockRejectedValue(new Error('encrypt failed'));

    await flushWatchers(nextTick);
    decrypted.value = 'local edit';
    await flushWatchers(nextTick);
    encryptedState.value = ciphertext('external-ciphertext');
    await flushWatchers(nextTick);

    expect(decrypted.value).toBe('external');
    expect(encryptedState.value).toBe(ciphertext('external-ciphertext'));
  });
});
