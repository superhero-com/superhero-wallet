import { ref } from 'vue';

const createTestContext = ({
  topBlockHeight = 100,
  preclaimedNames = {},
} = {}) => {
  jest.resetModules();

  const storage = new Map();
  const openDefaultModal = jest.fn();
  const handleUnknownError = jest.fn();
  const fetchAllPages = jest.fn().mockResolvedValue([]);
  const fetchJson = jest.fn().mockResolvedValue({});
  const fetchPendingTransactions = jest.fn().mockResolvedValue([]);
  const getNames = jest.fn().mockResolvedValue([]);
  const nameExtendTtl = jest.fn().mockResolvedValue(undefined);
  const nameUpdate = jest.fn().mockResolvedValue({});
  const namePreclaim = jest.fn().mockResolvedValue({ nameSalt: 123 });
  const nameClaim = jest.fn().mockResolvedValue({ hash: 'th_claim' });
  const sdk = {
    getContext: jest.fn(() => ({})),
    poll: jest.fn().mockResolvedValue({}),
    getHeight: jest.fn().mockResolvedValue(topBlockHeight),
    api: {
      getTopHeader: jest.fn().mockResolvedValue({ height: topBlockHeight }),
    },
  };

  storage.set('names-owned', ref([]));
  storage.set('preclaimed-names', ref(
    Object.keys(preclaimedNames).length ? JSON.stringify(preclaimedNames) : '{}',
  ));
  storage.set('names-default', ref({}));

  jest.doMock('@aeternity/aepp-sdk', () => ({
    Name: class {
      constructor(name, context) {
        this.name = name;
        this.context = context;
      }

      extendTtl = nameExtendTtl;

      update = nameUpdate;

      preclaim = namePreclaim;

      claim = nameClaim;
    },
  }));

  jest.doMock('@/utils', () => ({
    decryptedComputed: jest.fn((_key, encryptedState) => encryptedState),
    fetchAllPages,
    fetchJson,
    handleUnknownError,
  }));

  jest.doMock('@/composables', () => ({
    useAccounts: jest.fn(() => ({
      aeAccounts: ref([{ address: 'ak_test' }]),
      activeAccount: ref({ address: 'ak_test' }),
      isLocalAccountAddress: jest.fn(() => true),
      getLastActiveProtocolAccount: jest.fn(() => ({ address: 'ak_test' })),
    })),
    useAeSdk: jest.fn(() => ({
      nodeNetworkId: ref('ae_testnet'),
      getAeSdk: jest.fn().mockResolvedValue(sdk),
    })),
    useAuth: jest.fn(() => ({
      encryptionKey: ref('mock-encryption-key'),
    })),
    useModals: jest.fn(() => ({
      openDefaultModal,
    })),
    useNetworks: jest.fn(() => ({
      onNetworkChange: jest.fn(),
    })),
    useStorageRef: jest.fn((defaultValue, key) => {
      if (!storage.has(key)) {
        storage.set(key, ref(defaultValue));
      }
      return storage.get(key);
    }),
    useTopHeaderData: jest.fn(() => ({
      topBlockHeight: ref(topBlockHeight),
    })),
    useUi: jest.fn(() => ({
      saveErrorLog: ref(false),
    })),
  }));

  jest.doMock('@/composables/composablesHelpers', () => ({
    createPollingBasedOnMountedComponents: jest.fn(() => jest.fn()),
  }));

  jest.doMock('@/popup/plugins/i18n', () => ({
    tg: jest.fn((key) => key),
  }));

  jest.doMock('@/lib/ProtocolAdapterFactory', () => ({
    ProtocolAdapterFactory: {
      getAdapter: jest.fn(() => ({
        fetchPendingTransactions,
      })),
    },
  }));

  jest.doMock('@/protocols/aeternity/libs/AeAccountHdWallet', () => ({
    AeAccountHdWallet: jest.fn(() => ({
      sign: jest.fn(),
      signTransaction: jest.fn(),
    })),
  }));

  jest.doMock('@/protocols/aeternity/helpers', () => ({
    isInsufficientBalanceError: jest.fn(() => false),
  }));

  jest.doMock('@/protocols/aeternity/config', () => ({
    UPDATE_POINTER_ACTION: {
      update: 'update',
      extend: 'extend',
    },
    AE_AENS_NAME_AUCTION_MAX_LENGTH: 12 + '.chain'.length,
  }));

  jest.doMock('@/protocols/aeternity/composables/aeNetworkSettings', () => ({
    useAeNetworkSettings: jest.fn(() => ({
      aeActiveNetworkSettings: ref({ backendUrl: 'https://example.test' }),
    })),
  }));

  jest.doMock('@/protocols/aeternity/composables/aeTippingBackend', () => ({
    useAeTippingBackend: jest.fn(() => ({
      fetchCachedChainNames: jest.fn().mockResolvedValue(null),
    })),
  }));

  jest.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
    useAeMiddleware: jest.fn(() => ({
      isMiddlewareReady: ref(false),
      getMiddleware: jest.fn().mockResolvedValue({
        getNames,
      }),
      fetchFromMiddlewareCamelCased: jest.fn(),
    })),
  }));

  // eslint-disable-next-line global-require
  const aeNamesModule = require('@/protocols/aeternity/composables/aeNames');
  const aeNames = aeNamesModule.useAeNames({ pollingDisabled: true });

  return {
    aeNames,
    fetchPendingTransactions,
    sdk,
    storage,
    openDefaultModal,
    handleUnknownError,
    NAME_CLAIM_STATUS: aeNamesModule.NAME_CLAIM_STATUS,
    nameClaim,
    namePreclaim,
    nameUpdate,
  };
};

describe('useAeNames queued claims', () => {
  it('resumes submitted long-name claims and removes them after pointer update', async () => {
    const longName = 'verylongsupername.chain';
    const {
      aeNames,
      nameClaim,
      nameUpdate,
      sdk,
    } = createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'claim-submitted',
            claimTxHash: 'th_existing',
          },
        },
      },
    });

    await aeNames.claimPreclaimedNames();

    expect(nameClaim).not.toHaveBeenCalled();
    expect(sdk.poll).toHaveBeenCalledWith('th_existing');
    expect(nameUpdate).toHaveBeenCalledWith(
      { account_pubkey: 'ak_test' },
      { extendPointers: true },
    );
    expect(aeNames.preclaimedNames.value).toEqual({});
  });

  it('keeps pointer-update-pending entries persisted when pointer update fails', async () => {
    const longName = 'verylongsupername.chain';
    const {
      aeNames,
      nameUpdate,
      openDefaultModal,
    } = createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'claim-submitted',
            claimTxHash: 'th_existing',
          },
        },
      },
    });
    nameUpdate.mockRejectedValueOnce(new Error('pointer failed'));

    await aeNames.claimPreclaimedNames();

    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'pointer-update-pending',
      claimTxHash: 'th_existing',
    });
    expect(openDefaultModal).toHaveBeenCalledWith({ msg: 'pointer failed' });
  });

  it('processes the queued claims only once at a time', async () => {
    const longName = 'verylongsupername.chain';
    let resolveClaim;
    const { aeNames, nameClaim, sdk } = createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'preclaimed',
          },
        },
      },
    });
    nameClaim.mockImplementationOnce(() => new Promise((resolve) => {
      resolveClaim = resolve;
    }));

    const firstRun = aeNames.claimPreclaimedNames();
    const secondRun = aeNames.claimPreclaimedNames();
    await new Promise((resolve) => setImmediate(resolve));

    expect(nameClaim).toHaveBeenCalledTimes(1);

    resolveClaim({ hash: 'th_claim' });
    await Promise.all([firstRun, secondRun]);

    expect(sdk.poll).toHaveBeenCalledTimes(1);
  });

  it('reuses an already pending claim transaction instead of sending another one', async () => {
    const longName = 'verylongsupername.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameClaim,
      nameUpdate,
      sdk,
    } = createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'preclaimed',
          },
        },
      },
    });
    fetchPendingTransactions.mockResolvedValueOnce([{
      hash: 'th_existing_pending',
      tx: {
        type: 'NameClaimTx',
        accountId: 'ak_test',
        name: longName,
      },
    }]);

    await aeNames.claimPreclaimedNames();

    expect(nameClaim).not.toHaveBeenCalled();
    expect(sdk.poll).toHaveBeenCalledWith('th_existing_pending');
    expect(nameUpdate).toHaveBeenCalledWith(
      { account_pubkey: 'ak_test' },
      { extendPointers: true },
    );
    expect(aeNames.preclaimedNames.value).toEqual({});
  });
});
