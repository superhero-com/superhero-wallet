import { ref } from 'vue';

/**
 * `useAeNames` is exercised against REAL `useStorageRef`/`localStorage`,
 * `useNetworks`, `ProtocolAdapterFactory` (real adapter, `fetchPendingTransactions`
 * spied per test - the actual network boundary), `@/protocols/aeternity/config`
 * (plain constants), `@/protocols/aeternity/helpers`'s `isInsufficientBalanceError`
 * (simple predicate), `@/protocols/aeternity/composables/aeNetworkSettings` and
 * `aeTippingBackend` (both just route through the mocked `fetchJson` below), and
 * real `tg()` i18n.
 *
 * Still mocked, since they're either the aeternity SDK/network boundary itself or
 * genuinely heavy to run for real:
 *   - `@aeternity/aepp-sdk`'s `Name` class (constructs/signs real transactions)
 *   - `fetchAllPages`/`fetchJson` (`@/utils`) - the actual HTTP boundary
 *   - `useAccounts`/`useAeSdk`/`useAuth`/`useModals`/`useTopHeaderData` - mocked by
 *     their specific module path (never the `@/composables` barrel, which real
 *     composables like `accounts.ts` also import `useAuth` from - overriding the
 *     barrel would leak these fakes into code that isn't under test). Precise
 *     control over "who is logged in"/node connection/current block height is
 *     central to these test scenarios, not incidental
 *   - `decryptedComputed` (`@/utils`) - kept as a pass-through; the AES-GCM round trip
 *     for preclaimed names has its own dedicated coverage elsewhere and isn't the
 *     focus of these tests
 *   - `@/lib/logger` - side-effecting telemetry, plus it dodges `Logger.ts`'s own
 *     direct (non-barrel) imports of `useUi`/`useModals`
 *   - `AeAccountHdWallet` - real HD-wallet signing needs a real mnemonic seed
 *   - `useAeMiddleware` - a real GraphQL/swagger client built from a fetched spec;
 *     too heavy for what these tests need (deterministic `getNames()` results)
 */

/**
 * `pendingAutoExtendTxs`/`pendingNameTransferTxs` are real `useStorageRef`s: a
 * mutation (e.g. `upsertPendingNameTransferTx`) updates `.value` synchronously, but
 * persisting that back to `localStorage` happens via the ref's own internal deep
 * watcher, which settles a tick later. Reading raw storage back for assertions
 * needs to wait for that.
 */
function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

const createTestContext = async ({
  topBlockHeight = 100,
  preclaimedNames = {},
  pendingAutoExtendTxs = {},
  pendingNameTransferTxs = {},
} = {}) => {
  vi.resetModules();
  localStorage.clear();

  const openDefaultModal = vi.fn();
  const fetchAllPages = vi.fn().mockResolvedValue([]);
  const fetchJson = vi.fn().mockResolvedValue({});
  const fetchPendingTransactions = vi.fn().mockResolvedValue([]);
  const getNames = vi.fn().mockResolvedValue([]);
  const nameExtendTtl = vi.fn().mockResolvedValue({ hash: 'th_extend' });
  const nameUpdate = vi.fn().mockResolvedValue({});
  const namePreclaim = vi.fn().mockResolvedValue({ nameSalt: 123 });
  const nameClaim = vi.fn().mockResolvedValue({ hash: 'th_claim' });
  const nameGetState = vi.fn().mockRejectedValue(new Error('Name not found'));
  const nameTransfer = vi.fn().mockResolvedValue({ hash: 'th_transfer' });
  const sdk = {
    getContext: vi.fn(() => ({})),
    poll: vi.fn().mockResolvedValue({}),
    getHeight: vi.fn().mockResolvedValue(topBlockHeight),
    api: {
      getTopHeader: vi.fn().mockResolvedValue({ height: topBlockHeight }),
    },
  };

  // All `vi.doMock` calls must be registered here, before `registerAdapters` is
  // imported below - it transitively loads the real `@/composables` barrel (and
  // everything in it, including `aeNames.ts` and its dependencies), so mocking
  // afterwards would be too late for this module generation.
  vi.doMock('@aeternity/aepp-sdk', async () => {
    const actual = await vi.importActual('@aeternity/aepp-sdk');
    return {
      ...actual,
      // Constructed via `new Name(...)`; Vitest 4 requires a constructable
      // implementation (an arrow function is not a constructor).
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
    };
  });

  vi.doMock('@/utils', async () => {
    const actual = await vi.importActual('@/utils');
    return {
      ...actual,
      decryptedComputed: (_key, encryptedState) => encryptedState,
      fetchAllPages,
      fetchJson,
    };
  });

  // Mocked by their specific module path, NOT the `@/composables` barrel: the barrel
  // is imported (for real) by plenty of other real composables (e.g. `accounts.ts`
  // itself imports `useAuth` from the barrel) - overriding the barrel would leak
  // these incomplete fakes into code that isn't under test here. `useNetworks` and
  // `useStorageRef` are deliberately left real (see the file-level comment above).
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({
      aeAccounts: ref([{ address: 'ak_test' }]),
      activeAccount: ref({ address: 'ak_test' }),
      isLocalAccountAddress: () => true,
      getLastActiveProtocolAccount: () => ({ address: 'ak_test' }),
    }),
  }));
  // A single shared ref (not a fresh one per `useAeSdk()` call) so tests can switch
  // the active network and have the composable observe it.
  const nodeNetworkId = ref('ae_testnet');
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({
      nodeNetworkId,
      getAeSdk: vi.fn().mockResolvedValue(sdk),
    }),
  }));
  vi.doMock('@/composables/auth', () => ({
    useAuth: () => ({ encryptionKey: ref('irrelevant-key-decryptedComputed-is-a-passthrough') }),
  }));
  vi.doMock('@/composables/modals', () => ({
    useModals: () => ({ openDefaultModal }),
  }));
  vi.doMock('@/composables/topHeader', () => ({
    useTopHeaderData: () => ({ topBlockHeight: ref(topBlockHeight) }),
  }));

  vi.doMock('@/lib/logger', () => ({
    __esModule: true,
    default: { write: vi.fn() },
  }));

  vi.doMock('@/protocols/aeternity/libs/AeAccountHdWallet', () => ({
    AeAccountHdWallet: vi.fn(function AeAccountHdWallet() {
      this.sign = vi.fn();
      this.signTransaction = vi.fn();
    }),
  }));

  vi.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
    useAeMiddleware: () => ({
      isMiddlewareReady: ref(false),
      getMiddleware: vi.fn().mockResolvedValue({ getNames }),
      fetchFromMiddlewareCamelCased: vi.fn(),
    }),
  }));

  // The preferred (default) name now comes from the on-chain AddressLink contract.
  // Mock the reader so default-name polling is deterministic and offline.
  const getPreferredName = vi.fn().mockResolvedValue(undefined);
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkContract', () => ({
    useAeAddressLinkContract: () => ({ getPreferredName }),
  }));

  // Seed real `localStorage` BEFORE `registerAdapters` (below) is imported.
  // `AeternityAdapter` -> the aeternity composables barrel -> `aeTokenSales.ts`
  // imports `useNetworks` from the `@/composables` barrel, which transitively
  // (via `accountSelector.ts`) evaluates `aeNames.ts` itself - its module-level
  // `useStorageRef`s call `storage.get()` (and settle) the moment that happens,
  // not when this file later `import()`s `aeNames.ts` directly. Seeding has to
  // happen before that first, incidental load, or it's too late.
  const { WalletStorage } = await import('@/lib/WalletStorage');
  const { STORAGE_KEYS } = await import('@/constants');
  if (Object.keys(preclaimedNames).length) {
    // `decryptedComputed` is a passthrough above, so the "encrypted" storage
    // slot just holds the plain JSON string aeNames.ts expects to decode.
    WalletStorage.set(STORAGE_KEYS.preclaimedNames, JSON.stringify(preclaimedNames));
  }
  WalletStorage.set(STORAGE_KEYS.pendingNameAutoExtendTxs, pendingAutoExtendTxs);
  WalletStorage.set(STORAGE_KEYS.pendingNameTransferTxs, pendingNameTransferTxs);

  await import('@/protocols/registerAdapters');

  const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
  const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
  vi.spyOn(adapter, 'fetchPendingTransactions').mockImplementation(fetchPendingTransactions);

  const aeNamesModule = await import('@/protocols/aeternity/composables/aeNames');
  const aeNames = aeNamesModule.useAeNames({ pollingDisabled: true });

  // Let every storageRef finish restoring from localStorage before the test drives it.
  await new Promise((resolve) => { setTimeout(resolve, 0); });

  return {
    aeNames,
    fetchPendingTransactions,
    fetchAllPages,
    getPreferredName,
    nodeNetworkId,
    sdk,
    openDefaultModal,
    NAME_CLAIM_STATUS: aeNamesModule.NAME_CLAIM_STATUS,
    nameClaim,
    nameGetState,
    nameExtendTtl,
    nameTransfer,
    namePreclaim,
    nameUpdate,
    getPendingAutoExtendTxs: () => WalletStorage.get(STORAGE_KEYS.pendingNameAutoExtendTxs),
    getPendingNameTransferTxs: () => WalletStorage.get(STORAGE_KEYS.pendingNameTransferTxs),
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
    } = await createTestContext({
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
    } = await createTestContext({
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
    const { aeNames, nameClaim, sdk } = await createTestContext({
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
    } = await createTestContext({
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
    const { aeNames, nameExtendTtl } = await createTestContext({ topBlockHeight: 100 });
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
    const { aeNames, nameExtendTtl } = await createTestContext({ topBlockHeight: 100 });
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
    const { aeNames, nameExtendTtl } = await createTestContext({ topBlockHeight: 100 });
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
    const { aeNames, nameExtendTtl } = await createTestContext({ topBlockHeight: 100 });
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
    } = await createTestContext({
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
      getPendingAutoExtendTxs,
    } = await createTestContext({ topBlockHeight: 100 });
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
    expect(getPendingAutoExtendTxs().ae_testnet[pendingName]).toMatchObject({
      txHash: pendingTxHash,
    });
  });

  it('retries auto-extend when stored pending tx disappears from mempool', async () => {
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      getPendingAutoExtendTxs,
    } = await createTestContext({
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
    expect(getPendingAutoExtendTxs().ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_retry',
    });
  });

  it('cleans stale pending auto-extend entries for non-expiring names', async () => {
    const pendingName = 'not-expiring.chain';
    const { aeNames, getPendingAutoExtendTxs } = await createTestContext({
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

    expect(getPendingAutoExtendTxs().ae_testnet).toBeUndefined();
  });

  it('does not reject or resend when pending transaction lookup fails', async () => {
    const pendingName = 'expiring.chain';
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
      getPendingAutoExtendTxs,
    } = await createTestContext({
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
    expect(getPendingAutoExtendTxs().ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_lookup_unknown',
    });
  });

  it('continues processing other owners when one pending lookup fails', async () => {
    const {
      aeNames,
      fetchPendingTransactions,
      nameExtendTtl,
    } = await createTestContext({ topBlockHeight: 100 });
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
      getPendingAutoExtendTxs,
    } = await createTestContext({
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

    expect(getPendingAutoExtendTxs().ae_testnet[pendingName]).toMatchObject({
      txHash: 'th_old_pending',
    });
  });

  it('does not reject when the auto-extend pass has an unexpected setup failure', async () => {
    const { aeNames, sdk } = await createTestContext({ topBlockHeight: 100 });
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
      getPendingNameTransferTxs,
    } = await createTestContext();

    await aeNames.updateNamePointer({
      name: 'transfer.chain',
      address: 'ak_recipient',
      type: 'transfer',
    });
    await flushAsync();

    expect(nameTransfer).toHaveBeenCalledWith('ak_recipient', { waitMined: false });
    expect(getPendingNameTransferTxs().ae_testnet['transfer.chain'])
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
    } = await createTestContext({
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
      getPendingNameTransferTxs,
    } = await createTestContext({
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
    await flushAsync();

    expect(getPendingNameTransferTxs().ae_testnet).toBeUndefined();
    expect(aeNames.ownedNames.value[0]).toMatchObject({
      name: pendingName,
      pending: false,
      pendingStatus: undefined,
    });
  });
});

describe('useAeNames default (preferred) names', () => {
  it('keeps an optimistic default name while its link tx is still unmined', async () => {
    const { aeNames, getPreferredName } = await createTestContext();
    // The link tx has been broadcast but not mined, so the chain still has no name.
    getPreferredName.mockResolvedValue(undefined);

    aeNames.setDefaultNameOptimistic({ address: 'ak_test', name: 'new.chain' });
    await aeNames.updateDefaultNames();

    // Polling must not revert the optimistic value to the stale chain state.
    expect(aeNames.getName('ak_test').value).toBe('new.chain');
  });

  it('adopts the chain value and stops protecting once the change is mined', async () => {
    const { aeNames, getPreferredName } = await createTestContext();
    aeNames.setDefaultNameOptimistic({ address: 'ak_test', name: 'new.chain' });

    // Tx mined: the chain now returns the name, so the pending marker is cleared.
    getPreferredName.mockResolvedValue('new.chain');
    await aeNames.updateDefaultNames();
    expect(aeNames.getName('ak_test').value).toBe('new.chain');

    // With protection gone, a later chain change (e.g. name removed) is applied.
    getPreferredName.mockResolvedValue(undefined);
    await aeNames.updateDefaultNames();
    expect(aeNames.getName('ak_test').value).toBe('');
  });

  it('clears the optimistic default name immediately and keeps it cleared while unmined', async () => {
    const { aeNames, getPreferredName } = await createTestContext();
    // Chain still reports the old name because the unlink tx is not mined yet.
    getPreferredName.mockResolvedValue('old.chain');

    aeNames.setDefaultNameOptimistic({ address: 'ak_test', name: '' });
    expect(aeNames.getName('ak_test').value).toBe('');

    await aeNames.updateDefaultNames();
    expect(aeNames.getName('ak_test').value).toBe('');
  });
});

describe('useAeNames last-claimed-name fallback', () => {
  /** Middleware-shaped name; `activeFrom` becomes the claim height (`createdAtHeight`). */
  const middlewareName = (name, activeFrom, owner = 'ak_test') => ({
    info: {
      activeFrom,
      expireHeight: 50000,
      ownership: { current: owner },
      pointers: { accountPubkey: owner },
    },
    name,
    hash: `nm_${name}`,
  });

  /**
   * Names are published through `updateOwnedNames` (rather than assigned onto
   * `ownedNames` directly) so they get tagged with the network they belong to -
   * which is exactly what the fallback checks before using them.
   */
  const publishOwnedNames = async ({ aeNames, fetchAllPages }, names) => {
    fetchAllPages.mockResolvedValueOnce(names);
    await aeNames.updateOwnedNames();
  };

  it('falls back to the most recently claimed name when no default is set', async () => {
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [
      middlewareName('older.chain', 10),
      middlewareName('newest.chain', 30),
      middlewareName('middle.chain', 20),
    ]);

    expect(ctx.aeNames.getName('ak_test').value).toBe('newest.chain');
    // The fallback is a display convenience - no default is actually linked on-chain.
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('');
  });

  it('prefers the linked default name over the last claimed name', async () => {
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [middlewareName('newest.chain', 30)]);
    ctx.getPreferredName.mockResolvedValue('preferred.chain');

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.aeNames.getName('ak_test').value).toBe('preferred.chain');
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('preferred.chain');
  });

  it('ignores names that are not confirmed on-chain yet', async () => {
    const ctx = await createTestContext();
    // A newer, still-pending claim must not win over the confirmed name.
    ctx.fetchPendingTransactions.mockResolvedValueOnce([{
      hash: 'th_claiming',
      pending: true,
      tx: { type: 'NameClaimTx', accountId: 'ak_test', name: 'claiming.chain' },
    }]);
    await publishOwnedNames(ctx, [middlewareName('confirmed.chain', 10)]);

    expect(ctx.aeNames.getName('ak_test').value).toBe('confirmed.chain');
  });

  it('does not leak one account\'s claimed name to another account', async () => {
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [middlewareName('other.chain', 30, 'ak_other')]);

    expect(ctx.aeNames.getName('ak_test').value).toBe('');
  });

  it('stops using the previous network\'s claimed names after a network switch', async () => {
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [middlewareName('testnet-only.chain', 30)]);
    expect(ctx.aeNames.getName('ak_test').value).toBe('testnet-only.chain');

    ctx.nodeNetworkId.value = 'ae_mainnet';

    // The names still cached in memory belong to testnet - they must not show here.
    expect(ctx.aeNames.getName('ak_test').value).toBe('');
  });

  it('does not publish names fetched for a network that is no longer active', async () => {
    const ctx = await createTestContext();
    let resolveNames;
    ctx.fetchAllPages.mockImplementationOnce(() => new Promise((resolve) => {
      resolveNames = resolve;
    }));

    const update = ctx.aeNames.updateOwnedNames();
    await flushAsync(); // let the fetch actually start before switching
    ctx.nodeNetworkId.value = 'ae_mainnet'; // switched while the fetch was in flight
    resolveNames([middlewareName('testnet-only.chain', 30)]);
    await update;

    expect(ctx.aeNames.ownedNames.value).toEqual([]);
    expect(ctx.aeNames.getName('ak_test').value).toBe('');
  });
});
