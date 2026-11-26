// @ts-nocheck
import { ref } from 'vue';
import { AE_NETWORK_DEFAULT_SETTINGS } from '@/protocols/aeternity/config';

const NETWORK_ID = 'ae_uat';
const ADDRESS = 'ak_test';
const WAIT_FOR_CRYPTO = { timeout: 5000 };

/**
 * Real `useAeNames`, SecureMobileStorage and Vue refs on mobile: only the native plugin,
 * the node and the other composables are replaced.
 */
function mockMobileNames({
  nativeValues,
  getEncryptionKey,
  indexedNames = [],
  modals = {},
  getAeSdk = async () => ({}),
}) {
  vi.resetModules();
  localStorage.clear();
  vi.doMock('@/constants', async (importOriginal) => ({
    ...await importOriginal(),
    IS_MOBILE_APP: true,
    IS_EXTENSION: false,
    IS_IOS: false,
    IS_OFFSCREEN_TAB: false,
  }));
  // Only the native plugin is replaced; SecureMobileStorage and its Vue refs are real.
  vi.doMock('@aparajita/capacitor-secure-storage', () => ({
    KeychainAccess: { whenUnlocked: 1 },
    SecureStorage: {
      setDefaultKeychainAccess: vi.fn(),
      getItem: async (key) => nativeValues.get(key) ?? null,
      setItem: async (key, value) => { nativeValues.set(key, value); },
    },
  }));
  vi.doMock('@/utils', async (importOriginal) => ({
    ...await importOriginal(),
    fetchAllPages: vi.fn().mockResolvedValue(indexedNames.map((name) => ({
      name,
      hash: `nm_${name}`,
      activeFrom: 1,
      expireHeight: 50000,
      ownership: { current: ADDRESS },
      pointers: [],
    }))),
  }));
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({
      aeAccounts: ref([{ address: ADDRESS }]),
      activeAccount: ref({ address: ADDRESS }),
      // The test updates the names itself
      areAccountsReady: ref(false),
      isLocalAccountAddress: () => true,
      getLastActiveProtocolAccount: () => ({ address: ADDRESS }),
    }),
  }));
  vi.doMock('@/composables/auth', () => ({
    useAuth: () => ({ encryptionKey: getEncryptionKey(), isEncryptionKeyCurrent: () => true }),
  }));
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({ nodeNetworkId: ref(NETWORK_ID), getAeSdk }),
  }));
  vi.doMock('@/composables/modals', () => ({
    useModals: () => ({ openDefaultModal: vi.fn(), ...modals }),
  }));
  vi.doMock('@/composables/topHeader', () => ({
    useTopHeaderData: () => ({ topBlockHeight: ref(100) }),
  }));
  vi.doMock('@/lib/logger', () => ({ default: { write: vi.fn() } }));
  vi.doMock('@/protocols/aeternity/libs/AeAccountHdWallet', () => ({
    AeAccountHdWallet: vi.fn(),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
    useAeMiddleware: () => ({
      fetchFromMiddlewareCamelCased: vi.fn(),
      fetchFromMiddlewareCamelCasedPrecise: vi.fn(),
      fetchNameByHash: vi.fn(),
    }),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeTippingBackend', () => ({
    useAeTippingBackend: () => ({ fetchCachedChainNames: async () => ({}) }),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkContract', () => ({
    useAeAddressLinkContract: () => ({ isAddressLinkSupported: ref(false) }),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkBackend', () => ({
    useAeAddressLinkBackend: () => ({}),
  }));
}

/** Once the native values are set: the storage refs read them when the module loads. */
async function openNames() {
  const { PROTOCOL_LIST } = await import('@/constants');
  const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
  class TestProtocolAdapter {
    fetchPendingTransactions = vi.fn().mockResolvedValue([]);

    getNetworkTypeDefaultValues = vi.fn((type) => AE_NETWORK_DEFAULT_SETTINGS[type] || {});
  }
  PROTOCOL_LIST.forEach((protocol) => (
    ProtocolAdapterFactory.registerAdapter(protocol, TestProtocolAdapter)
  ));
  const { useAeNames } = await import('@/protocols/aeternity/composables/aeNames');
  return useAeNames({ pollingDisabled: true });
}

describe('useAeNames mobile encrypted storage', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('removes two indexed claims without losing a pending salt after reopening', async () => {
    const nativeValues = new Map<string, string>();
    let encryptionKey;
    const indexedNames = ['first-indexed.chain', 'second-indexed.chain'];
    mockMobileNames({ nativeValues, getEncryptionKey: () => encryptionKey, indexedNames });

    const { LOCAL_STORAGE_PREFIX, STORAGE_KEYS } = await import('@/constants');
    const {
      decodeBase64, decrypt, encodeBase64, encrypt, importEncryptionKey, IV_LENGTH,
    } = await import('@/utils/crypto');
    const keyBytes = new Uint8Array(32).fill(7);
    encryptionKey = ref(await importEncryptionKey(keyBytes));
    const pendingName = 'still-pending.chain';
    const pending = {
      address: ADDRESS,
      name: pendingName,
      salt: 987654321,
      blockHeight: 99,
      autoExtend: false,
      status: 'preclaim-submitted',
    };
    const original = {
      [NETWORK_ID]: Object.fromEntries([
        ...indexedNames.map((name, index) => [name, {
          address: ADDRESS,
          name,
          salt: index + 1,
          blockHeight: 99,
          autoExtend: false,
          status: 'claimed',
          claimedAt: Date.now(),
        }]),
        [pendingName, pending],
      ]),
    };
    const initialCiphertext = await encrypt(encryptionKey.value, JSON.stringify(original));
    nativeValues.set(
      `${LOCAL_STORAGE_PREFIX}_${STORAGE_KEYS.mobileDataKey}`,
      JSON.stringify(encodeBase64(keyBytes)),
    );
    nativeValues.set(
      `${LOCAL_STORAGE_PREFIX}_${STORAGE_KEYS.preclaimedNames}`,
      JSON.stringify(initialCiphertext),
    );

    const names = await openNames();
    await vi.waitFor(() => expect(names.preclaimedNames.value).toEqual(original), WAIT_FOR_CRYPTO);
    // Finish restoration's write suppression before changing the registry.
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    // Hold only the first replacement's display decrypt. A subsequent updater's
    // independent read of the same ciphertext still uses real, unblocked crypto.
    const originalBytes = decodeBase64(initialCiphertext).subarray(IV_LENGTH);
    const realDecrypt = globalThis.crypto.subtle.decrypt.bind(globalThis.crypto.subtle);
    let releaseDisplay;
    const gate = new Promise((resolve) => { releaseDisplay = resolve; });
    let finishDisplay;
    const displayFinished = new Promise((resolve) => { finishDisplay = resolve; });
    let displayPaused = false;
    const decryptSpy = vi.spyOn(globalThis.crypto.subtle, 'decrypt')
      .mockImplementation(async (...args) => {
        if (!displayPaused && !Buffer.from(args[2]).equals(originalBytes)) {
          displayPaused = true;
          try {
            await gate;
            return await realDecrypt(...args);
          } finally {
            finishDisplay();
          }
        }
        return realDecrypt(...args);
      });
    const expected = { [NETWORK_ID]: { [pendingName]: pending } };
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    try {
      await names.updateOwnedNames();
      await vi.waitFor(async () => {
        const ciphertext = await SecureMobileStorage.get(STORAGE_KEYS.preclaimedNames);
        expect(JSON.parse(await decrypt(encryptionKey.value, ciphertext))).toEqual(expected);
      }, WAIT_FOR_CRYPTO);
      expect(displayPaused).toBe(true);
    } finally {
      releaseDisplay();
      if (displayPaused) await displayFinished;
      // Drain the wrapper and Vue watcher continuations before reopening storage.
      await new Promise((resolve) => { setTimeout(resolve, 0); });
      decryptSpy.mockRestore();
    }
    expect(names.preclaimedNames.value).toEqual(expected);

    // Rebuild the real encrypted storage/decryption refs without any in-memory registry.
    vi.resetModules();
    const { useStorageRef } = await import('@/composables/storageRef');
    const { decryptedComputed } = await import('@/utils/common');
    const ciphertext = useStorageRef(null, STORAGE_KEYS.preclaimedNames, {
      enableSecureStorage: true,
    });
    const reopened = decryptedComputed(encryptionKey, ciphertext, '{}');
    await vi.waitFor(() => expect(JSON.parse(reopened.value)).toEqual(expected), WAIT_FOR_CRYPTO);
  });

  it('offers to remove names the key cannot read, after which a claim gets past them', async () => {
    const nativeValues = new Map<string, string>();
    let encryptionKey;
    const openConfirmModal = vi.fn().mockResolvedValue(undefined);
    const openDefaultModal = vi.fn();
    // Reached only once the names no longer block the claim.
    const getAeSdk = vi.fn().mockRejectedValue(new Error('Node unavailable'));
    mockMobileNames({
      nativeValues,
      getEncryptionKey: () => encryptionKey,
      modals: { openConfirmModal, openDefaultModal },
      getAeSdk,
    });
    const { LOCAL_STORAGE_PREFIX, STORAGE_KEYS } = await import('@/constants');
    const { encodeBase64, encrypt, importEncryptionKey } = await import('@/utils/crypto');
    const keyBytes = new Uint8Array(32).fill(7);
    encryptionKey = ref(await importEncryptionKey(keyBytes));
    // E.g. left by a reset whose native clear stopped early, under the previous wallet's key.
    const previousKey = await importEncryptionKey(new Uint8Array(32).fill(9));
    nativeValues.set(
      `${LOCAL_STORAGE_PREFIX}_${STORAGE_KEYS.mobileDataKey}`,
      JSON.stringify(encodeBase64(keyBytes)),
    );
    nativeValues.set(
      `${LOCAL_STORAGE_PREFIX}_${STORAGE_KEYS.preclaimedNames}`,
      JSON.stringify(await encrypt(previousKey, '{}')),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const names = await openNames();
    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith(
      'Unknown rejection',
      expect.objectContaining({ name: 'OperationError' }),
    ), WAIT_FOR_CRYPTO);

    expect(await names.addNameToClaimQueue('new-name.chain', ADDRESS, false)).toBe(false);
    expect(openConfirmModal).toHaveBeenCalledOnce();
    expect(openDefaultModal).not.toHaveBeenCalled();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    await vi.waitFor(async () => (
      expect(await SecureMobileStorage.get(STORAGE_KEYS.preclaimedNames)).toBeNull()
    ));

    expect(await names.addNameToClaimQueue('new-name.chain', ADDRESS, false)).toBe(false);
    expect(openConfirmModal).toHaveBeenCalledOnce();
    expect(openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
      msg: 'Node unavailable',
    }));
  });
});
