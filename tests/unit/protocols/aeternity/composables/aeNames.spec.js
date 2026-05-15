import { ref } from 'vue';

const createTestContext = ({
  topBlockHeight = 100,
  preclaimedNames = {},
  pendingAutoExtendTxs = {},
  pendingNameTransferTxs = {},
} = {}) => {
  jest.resetModules();

  const storage = new Map();
  const openDefaultModal = jest.fn();
  const handleUnknownError = jest.fn();
  const fetchAllPages = jest.fn().mockResolvedValue([]);
  const fetchJson = jest.fn().mockResolvedValue({});
  const fetchPendingTransactions = jest.fn().mockResolvedValue([]);
  const getNames = jest.fn().mockResolvedValue([]);
  const nameExtendTtl = jest.fn().mockResolvedValue({ hash: 'th_extend' });
  const nameUpdate = jest.fn().mockResolvedValue({});
  const namePreclaim = jest.fn().mockResolvedValue({ nameSalt: 123 });
  const nameClaim = jest.fn().mockResolvedValue({ hash: 'th_claim' });
  const nameGetState = jest.fn().mockRejectedValue(new Error('Name not found'));
  const nameTransfer = jest.fn().mockResolvedValue({ hash: 'th_transfer' });
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
  storage.set('pending-name-auto-extend-txs', ref(pendingAutoExtendTxs));
  storage.set('pending-name-transfer-txs', ref(pendingNameTransferTxs));
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

      getState = nameGetState;

      transfer = nameTransfer;
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

  jest.doMock('@/composables/ui', () => ({
    useUi: jest.fn(() => ({
      saveErrorLog: ref(false),
    })),
  }));

  jest.doMock('@/composables/modals', () => ({
    useModals: jest.fn(() => ({
      openDefaultModal,
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
      transfer: 'transfer',
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
    fetchAllPages,
    sdk,
    storage,
    openDefaultModal,
    handleUnknownError,
    NAME_CLAIM_STATUS: aeNamesModule.NAME_CLAIM_STATUS,
    nameClaim,
    nameGetState,
    nameExtendTtl,
    nameTransfer,
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

describe('useAeNames auto-extend', () => {
  it('extends expiring owned names with auto-extend enabled', async () => {
    const { aeNames, nameExtendTtl } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: 'expiring.chain',
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).toHaveBeenCalledTimes(1);
  });

  it('does not extend names when auto-extend is disabled', async () => {
    const { aeNames, nameExtendTtl } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: 'expiring.chain',
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: false,
      hash: 'nm_expiring',
    }];

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).not.toHaveBeenCalled();
  });

  it('does not extend pending names', async () => {
    const { aeNames, nameExtendTtl } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: 'pending-transfer.chain',
      owner: 'ak_test',
      pending: true,
      pendingStatus: 'transferring',
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_pending_transfer',
    }];

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).not.toHaveBeenCalled();
  });

  it('does not extend already expired names from stale owned-name state', async () => {
    const { aeNames, nameExtendTtl } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: 'expired.chain',
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 100,
      autoExtend: true,
      hash: 'nm_expired',
    }];

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).not.toHaveBeenCalled();
  });

  it('does not resend while a matching pending auto-extend tx exists after reopen', async () => {
    const pendingTxHash = 'th_extend_pending';
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
    } = createTestContext({
      topBlockHeight: 100,
      pendingAutoExtendTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            txHash: pendingTxHash,
            createdAt: 1,
          },
        },
      },
    });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    fetchPendingTransactions.mockResolvedValueOnce([{
      hash: pendingTxHash,
      tx: {
        type: 'NameUpdateTx',
        accountId: 'ak_test',
        name: pendingName,
      },
    }]);

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).not.toHaveBeenCalled();
  });

  it('stores discovered pending NameUpdateTx and skips sending a duplicate', async () => {
    const pendingName = 'expiring.chain';
    const pendingTxHash = 'th_existing_pending_update';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      storage,
    } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    fetchPendingTransactions.mockResolvedValueOnce([{
      hash: pendingTxHash,
      tx: {
        type: 'NameUpdateTx',
        accountId: 'ak_test',
        name: pendingName,
      },
    }]);

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).not.toHaveBeenCalled();
    expect(storage.get('pending-name-auto-extend-txs').value.ae_testnet[pendingName]).toMatchObject({
      txHash: pendingTxHash,
    });
  });

  it('retries auto-extend when stored pending tx disappears from mempool', async () => {
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      storage,
    } = createTestContext({
      topBlockHeight: 100,
      pendingAutoExtendTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            txHash: 'th_old_pending',
            createdAt: 1,
          },
        },
      },
    });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    fetchPendingTransactions.mockResolvedValueOnce([]);
    nameExtendTtl.mockResolvedValueOnce({ hash: 'th_retry' });

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).toHaveBeenCalledTimes(1);
    expect(storage.get('pending-name-auto-extend-txs').value.ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_retry',
    });
  });

  it('cleans stale pending auto-extend entries for non-expiring names', async () => {
    const pendingName = 'not-expiring.chain';
    const { aeNames, storage } = createTestContext({
      topBlockHeight: 100,
      pendingAutoExtendTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            txHash: 'th_stale',
            createdAt: 1,
          },
        },
      },
    });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 50000,
      autoExtend: true,
      hash: 'nm_not_expiring',
    }];

    await aeNames.extendExpiringOwnedNames();

    expect(storage.get('pending-name-auto-extend-txs').value.ae_testnet).toBeUndefined();
  });

  it('does not reject or resend when pending transaction lookup fails', async () => {
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      storage,
    } = createTestContext({
      topBlockHeight: 100,
      pendingAutoExtendTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            txHash: 'th_lookup_unknown',
            createdAt: 1,
          },
        },
      },
    });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    fetchPendingTransactions.mockRejectedValueOnce(new Error('lookup failed'));

    await expect(aeNames.extendExpiringOwnedNames()).resolves.toBeUndefined();

    expect(nameExtendTtl).not.toHaveBeenCalled();
    expect(storage.get('pending-name-auto-extend-txs').value.ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_lookup_unknown',
    });
  });

  it('continues processing other owners when one pending lookup fails', async () => {
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
    } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [
      {
        name: 'failed-lookup.chain',
        owner: 'ak_test',
        pending: false,
        pointers: {},
        createdAtHeight: 1,
        expiresAt: 150,
        autoExtend: true,
        hash: 'nm_failed_lookup',
      },
      {
        name: 'can-extend.chain',
        owner: 'ak_other',
        pending: false,
        pointers: {},
        createdAtHeight: 1,
        expiresAt: 150,
        autoExtend: true,
        hash: 'nm_can_extend',
      },
    ];
    fetchPendingTransactions
      .mockRejectedValueOnce(new Error('lookup failed'))
      .mockResolvedValueOnce([]);

    await aeNames.extendExpiringOwnedNames();

    expect(nameExtendTtl).toHaveBeenCalledTimes(1);
  });

  it('keeps stored pending tx when resend fails after pending tx disappears', async () => {
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      storage,
    } = createTestContext({
      topBlockHeight: 100,
      pendingAutoExtendTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            txHash: 'th_old_pending',
            createdAt: 1,
          },
        },
      },
    });
    aeNames.ownedNames.value = [{
      name: pendingName,
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    fetchPendingTransactions.mockResolvedValueOnce([]);
    nameExtendTtl.mockRejectedValueOnce(new Error('send failed'));

    await aeNames.extendExpiringOwnedNames();

    expect(storage.get('pending-name-auto-extend-txs').value.ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_old_pending',
    });
  });

  it('does not reject when the auto-extend pass has an unexpected setup failure', async () => {
    const { aeNames, sdk } = createTestContext({ topBlockHeight: 100 });
    aeNames.ownedNames.value = [{
      name: 'expiring.chain',
      owner: 'ak_test',
      pending: false,
      pointers: {},
      createdAtHeight: 1,
      expiresAt: 150,
      autoExtend: true,
      hash: 'nm_expiring',
    }];
    sdk.getHeight.mockRejectedValueOnce(new Error('height failed'));

    await expect(aeNames.extendExpiringOwnedNames()).resolves.toBeUndefined();
  });
});

describe('useAeNames name transfers', () => {
  const middlewareName = (name, owner = 'ak_test') => ({
    info: {
      activeFrom: 1,
      expireHeight: 150,
      ownership: { current: owner },
      pointers: { accountPubkey: owner },
    },
    name,
    hash: `nm_${name}`,
  });

  it('stores a pending transfer transaction after submitting a transfer', async () => {
    const {
      aeNames,
      nameTransfer,
      storage,
    } = createTestContext();

    await aeNames.updateNamePointer({
      name: 'transfer.chain',
      address: 'ak_recipient',
      type: 'transfer',
    });

    expect(nameTransfer).toHaveBeenCalledWith('ak_recipient', { waitMined: false });
    expect(storage.get('pending-name-transfer-txs').value.ae_testnet['transfer.chain'])
      .toMatchObject({
        address: 'ak_test',
        name: 'transfer.chain',
        recipientAddress: 'ak_recipient',
        txHash: 'th_transfer',
      });
  });

  it('marks still-owned names as transferring while the transfer tx is pending', async () => {
    const pendingName = 'transfer.chain';
    const pendingTxHash = 'th_transfer_pending';
    const {
      aeNames,
      fetchAllPages,
      fetchPendingTransactions,
    } = createTestContext({
      pendingNameTransferTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            recipientAddress: 'ak_recipient',
            txHash: pendingTxHash,
            createdAt: Date.now(),
          },
        },
      },
    });
    fetchAllPages.mockResolvedValueOnce([middlewareName(pendingName)]);
    fetchPendingTransactions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        hash: pendingTxHash,
        tx: {
          type: 'NameTransferTx',
          accountId: 'ak_test',
          name: pendingName,
        },
      }]);

    await aeNames.updateOwnedNames();

    expect(aeNames.ownedNames.value[0]).toMatchObject({
      name: pendingName,
      pending: true,
      pendingStatus: 'transferring',
    });
  });

  it('clears stale transfer state when the old owner still owns the name and tx is gone', async () => {
    const pendingName = 'transfer.chain';
    const {
      aeNames,
      fetchAllPages,
      fetchPendingTransactions,
      storage,
    } = createTestContext({
      pendingNameTransferTxs: {
        ae_testnet: {
          [pendingName]: {
            address: 'ak_test',
            name: pendingName,
            recipientAddress: 'ak_recipient',
            txHash: 'th_dropped_transfer',
            createdAt: 1,
          },
        },
      },
    });
    fetchAllPages.mockResolvedValueOnce([middlewareName(pendingName)]);
    fetchPendingTransactions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await aeNames.updateOwnedNames();

    expect(storage.get('pending-name-transfer-txs').value.ae_testnet).toBeUndefined();
    expect(aeNames.ownedNames.value[0]).toMatchObject({
      name: pendingName,
      pending: false,
      pendingStatus: undefined,
    });
  });
});
