import { ref } from 'vue';
import { AE_NETWORK_DEFAULT_SETTINGS } from '@/protocols/aeternity/config';
import { restError } from '../../../helpers/restError';

/**
 * `useAeNames` is exercised against REAL `useStorageRef`/`localStorage`,
 * `useNetworks`, `ProtocolAdapterFactory` (real registry with lightweight protocol
 * adapter stubs for the pending-transaction boundary), `@/protocols/aeternity/config`
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
 *   - `useAeMiddleware` - the HTTP boundary of the middleware. With `middlewareResponses`
 *     the real one runs instead, with the real `fetchAllPages`, and reads those responses
 *     as the middleware renders them.
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
  startupNames = [],
  storedOwnedNames = [],
  preferredName,
  accounts = [{ address: 'ak_test' }],
  accountsReady = true,
  middlewareResponses,
  networkId = 'ae_testnet',
  runningInPopup = false,
  setUpStartup = () => {},
} = {}) => {
  vi.resetModules();
  localStorage.clear();
  if (runningInPopup) {
    vi.doMock('@/constants/environment', async (importOriginal) => ({
      ...await importOriginal(),
      RUNNING_IN_POPUP: true,
    }));
  } else {
    vi.doUnmock('@/constants/environment');
  }

  const openDefaultModal = vi.fn();
  const fetchAllPages = vi.fn().mockResolvedValue([]);
  const fetchJson = vi.fn().mockResolvedValue({});
  if (middlewareResponses) {
    const responses = {
      // Nothing owned unless the test says so
      ...Object.fromEntries(accounts.map(({ address }) => [
        `/v3/names?owned_by=${address}&state=active&limit=100`,
        '{"data":[],"next":null}',
      ])),
      ...middlewareResponses,
    };
    const findResponse = (url) => responses[url.slice(url.indexOf('/mdw/') + '/mdw'.length)];
    fetchJson.mockImplementation(async (url) => {
      if (!url.includes('/mdw/')) {
        return {};
      }
      const body = findResponse(url);
      if (body === undefined) {
        throw Object.assign(new Error('HTTP 404'), { statusCode: 404 });
      }
      return JSON.parse(body);
    });
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const body = findResponse(url);
      return body === undefined
        ? new Response('{"error":"not found"}', { status: 404 })
        : new Response(body);
    }));
  }
  const fetchPendingTransactions = vi.fn().mockResolvedValue([]);
  const nameExtendTtl = vi.fn().mockResolvedValue({ hash: 'th_extend' });
  const nameUpdate = vi.fn().mockResolvedValue({});
  const nameClaim = vi.fn().mockResolvedValue({ hash: 'th_claim' });
  const nameGetState = vi.fn().mockRejectedValue(restError('Name not found', { statusCode: 404 }));
  const nameTransfer = vi.fn().mockResolvedValue({ hash: 'th_transfer' });
  const sdk = {
    getContext: vi.fn(() => ({})),
    poll: vi.fn().mockResolvedValue({}),
    getHeight: vi.fn().mockResolvedValue(topBlockHeight),
    api: {
      getTopHeader: vi.fn().mockResolvedValue({ height: topBlockHeight }),
      getAuctionEntryByName: vi.fn().mockRejectedValue(
        restError('Name auction not found', { statusCode: 404 }),
      ),
    },
  };

  // Avoid importing every real protocol adapter for each fresh module context. This
  // composable only needs the Aeternity pending-transaction boundary from the registry.
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

        claim = nameClaim;

        getState = nameGetState;

        transfer = nameTransfer;
      },
    };
  });

  vi.doMock('@/utils', async () => {
    const actual = await vi.importActual('@/utils');
    const { readVault, refreshVault, writeVaultField } = await vi.importActual('@/lib/WalletVault');
    const { STORAGE_KEYS } = await vi.importActual('@/constants');
    return {
      ...actual,
      decryptedComputed: (_key, encryptedState) => Object.assign(encryptedState, {
        async update(transform) {
          await refreshVault();
          const snapshot = readVault();
          await writeVaultField(
            STORAGE_KEYS.preclaimedNames,
            transform(snapshot.values[STORAGE_KEYS.preclaimedNames] || '{}'),
            snapshot,
          );
        },
      }),
      fetchAllPages: middlewareResponses ? actual.fetchAllPages : fetchAllPages,
      fetchJson,
    };
  });

  // Mocked by their specific module path, NOT the `@/composables` barrel: the barrel
  // is imported (for real) by plenty of other real composables (e.g. `accounts.ts`
  // itself imports `useAuth` from the barrel) - overriding the barrel would leak
  // these incomplete fakes into code that isn't under test here. `useNetworks` and
  // `useStorageRef` are deliberately left real (see the file-level comment above).
  const aeAccounts = ref(accounts);
  const areAccountsReady = ref(accountsReady);
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({
      aeAccounts,
      activeAccount: ref({ address: 'ak_test' }),
      areAccountsReady,
      isLocalAccountAddress: () => true,
      getLastActiveProtocolAccount: () => ({ address: 'ak_test' }),
    }),
  }));
  // A single shared ref (not a fresh one per `useAeSdk()` call) so tests can switch
  // the active network and have the composable observe it.
  const nodeNetworkId = ref(networkId);
  const getAeSdk = vi.fn().mockResolvedValue(sdk);
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({ nodeNetworkId, getAeSdk }),
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

  const fetchFromMiddlewareCamelCased = vi.fn();
  const fetchFromMiddlewareCamelCasedPrecise = vi.fn();
  const fetchNameByHash = vi.fn();
  if (middlewareResponses) {
    vi.doUnmock('@/protocols/aeternity/composables/aeMiddleware');
  } else {
    vi.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
      useAeMiddleware: () => ({
        fetchFromMiddlewareCamelCased,
        fetchFromMiddlewareCamelCasedPrecise,
        fetchNameByHash,
      }),
    }));
  }

  // The preferred (default) name now comes from the on-chain AddressLink contract.
  // Mock the reader so default-name polling is deterministic and offline.
  const getPreferredName = vi.fn().mockResolvedValue(preferredName);
  // The AddressLink deployment exists on the default (mainnet/testnet) networks
  // these tests run against; flip `.value` to false to exercise the unsupported
  // (custom) network gate that skips the default-name sync.
  const isAddressLinkSupported = ref(true);
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkContract', () => ({
    useAeAddressLinkContract: () => ({ getPreferredName, isAddressLinkSupported }),
  }));
  // aeNames now also drives the backend-sponsored link/unlink flow; stub it so
  // `changeDefaultName` never reaches the real HTTP/signing boundary.
  const linkPreferredAensName = vi.fn().mockResolvedValue('th_stubbedLinkTxHash');
  const unlinkPreferredAensName = vi.fn().mockResolvedValue('th_stubbedUnlinkTxHash');
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkBackend', () => ({
    useAeAddressLinkBackend: () => ({ linkPreferredAensName, unlinkPreferredAensName }),
  }));

  // Seed real `localStorage` before the protocol registry imports the composables barrel.
  // `AeternityAdapter` -> the aeternity composables barrel -> `aeTokenSales.ts`
  // imports `useNetworks` from the `@/composables` barrel, which transitively
  // (via `accountSelector.ts`) evaluates `aeNames.ts` itself - its module-level
  // `useStorageRef`s call `storage.get()` (and settle) the moment that happens,
  // not when this file later `import()`s `aeNames.ts` directly. Seeding has to
  // happen before that first, incidental load, or it's too late.
  const { WalletStorage } = await import('@/lib/WalletStorage');
  const { STORAGE_KEYS } = await import('@/constants');
  // `localStorage` persists across `createTestContext` calls (only modules are
  // reset), so a previous test's persisted default/owned names would be restored
  // asynchronously into this context and could clobber the state this test sets -
  // an intermittent, order-dependent flake. Remove those keys so the storageRef
  // restore reads `null` and no-ops (see `setLocalState`), giving each context a
  // clean, deterministic names registry.
  WalletStorage.remove(STORAGE_KEYS.namesDefault);
  WalletStorage.remove(STORAGE_KEYS.namesOwned);
  WalletStorage.remove(STORAGE_KEYS.namesOwnedNetworkId);
  WalletStorage.remove(STORAGE_KEYS.pendingDefaultNames);
  if (storedOwnedNames.length) {
    WalletStorage.set(STORAGE_KEYS.namesOwned, storedOwnedNames);
    WalletStorage.set(STORAGE_KEYS.namesOwnedNetworkId, networkId);
  }
  if (Object.keys(preclaimedNames).length) {
    // `decryptedComputed` is a passthrough above, so the "encrypted" storage
    // slot just holds the plain JSON string aeNames.ts expects to decode.
    WalletStorage.set(STORAGE_KEYS.preclaimedNames, JSON.stringify(preclaimedNames));
  }
  WalletStorage.set(STORAGE_KEYS.pendingNameAutoExtendTxs, pendingAutoExtendTxs);
  WalletStorage.set(STORAGE_KEYS.pendingNameTransferTxs, pendingNameTransferTxs);

  const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
  const { PROTOCOL_LIST } = await import('@/constants');
  function TestProtocolAdapter() {
    this.getNetworkTypeDefaultValues = (type) => (type === 'mainnet' || type === 'testnet'
      ? AE_NETWORK_DEFAULT_SETTINGS[type]
      : {});
    this.fetchPendingTransactions = fetchPendingTransactions;
  }
  PROTOCOL_LIST.forEach((protocol) => (
    ProtocolAdapterFactory.registerAdapter(protocol, TestProtocolAdapter)
  ));

  const aeNamesModule = await import('@/protocols/aeternity/composables/aeNames');
  // Let every storageRef finish restoring from localStorage, as the requests of the app
  // take longer than that.
  const { ensureVaultReady } = await import('@/lib/WalletVault');
  await ensureVaultReady();
  await flushAsync();
  await flushAsync();

  // The names of the account are loaded as soon as the composable is used
  fetchAllPages.mockResolvedValueOnce(startupNames);
  setUpStartup({ fetchAllPages, fetchPendingTransactions });
  const aeNames = aeNamesModule.useAeNames({ pollingDisabled: true });
  await vi.waitFor(() => expect(aeNames.areNamesFetching.value).toBe(false));
  await flushAsync();
  vi.clearAllMocks();

  return {
    aeNames,
    aeAccounts,
    areAccountsReady,
    fetchPendingTransactions,
    fetchAllPages,
    fetchFromMiddlewareCamelCased,
    fetchFromMiddlewareCamelCasedPrecise,
    fetchNameByHash,
    getPreferredName,
    isAddressLinkSupported,
    getAeSdk,
    linkPreferredAensName,
    unlinkPreferredAensName,
    nodeNetworkId,
    sdk,
    openDefaultModal,
    NAME_CLAIM_STATUS: aeNamesModule.NAME_CLAIM_STATUS,
    nameClaim,
    nameGetState,
    nameExtendTtl,
    nameTransfer,
    nameUpdate,
    getPendingAutoExtendTxs: () => WalletStorage.get(STORAGE_KEYS.pendingNameAutoExtendTxs),
    getPendingNameTransferTxs: () => WalletStorage.get(STORAGE_KEYS.pendingNameTransferTxs),
  };
};

// `middlewareResponses` stubs `fetch`
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAeNames queued claims', () => {
  const middlewareName = (name, owner = 'ak_test') => ({
    activeFrom: 1,
    expireHeight: 50000,
    ownership: { current: owner },
    pointers: [{ key: 'account_pubkey', id: owner, encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR' }],
    name,
    hash: `nm_${name}`,
  });

  it('resumes submitted long-name claims and marks them claimed after pointer update', async () => {
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
    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'claimed',
      claimedAt: expect.any(Number),
    });
  });

  it('keeps a claimed name listed until the middleware indexes it', async () => {
    // The claim is mined and out of the mempool, but the middleware lags behind the
    // node by minutes - dropping the queue entry then made the name vanish from the list.
    const longName = 'verylongsupername.chain';
    const { aeNames, fetchAllPages } = await createTestContext({
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
    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'claimed',
    });

    // Still not indexed on the next poll.
    await aeNames.updateOwnedNames();
    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'claimed',
    });

    fetchAllPages.mockResolvedValueOnce([middlewareName(longName)]);
    await aeNames.updateOwnedNames();

    expect(aeNames.preclaimedNames.value).toEqual({});
    expect(aeNames.ownedNames.value).toEqual([
      expect.objectContaining({ name: longName, owner: 'ak_test' }),
    ]);
  });

  it('drops a claimed name the middleware never indexes after the max age', async () => {
    const longName = 'verylongsupername.chain';
    const { aeNames } = await createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'claimed',
            claimTxHash: 'th_existing',
            claimedAt: 1,
          },
        },
      },
    });

    await aeNames.updateOwnedNames();

    expect(aeNames.preclaimedNames.value).toEqual({});
  });

  it('does not process claimed names again', async () => {
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
            status: 'claimed',
            claimTxHash: 'th_existing',
            claimedAt: Date.now(),
          },
        },
      },
    });

    await aeNames.claimPreclaimedNames();

    expect(nameClaim).not.toHaveBeenCalled();
    expect(sdk.poll).not.toHaveBeenCalled();
    expect(nameUpdate).not.toHaveBeenCalled();
    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'claimed',
    });
  });

  it('removes auction names from the queue right after the claim', async () => {
    // Short names go to auction and are not active until it ends, so there is no
    // indexing to wait for.
    const shortName = 'short.chain';
    const { aeNames, nameUpdate } = await createTestContext({
      preclaimedNames: {
        ae_testnet: {
          [shortName]: {
            address: 'ak_test',
            name: shortName,
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

    expect(nameUpdate).not.toHaveBeenCalled();
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
    expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
      status: 'claimed',
    });
  });

  describe('when claiming fails', () => {
    const longName = 'verylongsupername.chain';
    const queuedClaim = (fields) => ({
      preclaimedNames: {
        ae_testnet: {
          [longName]: {
            address: 'ak_test',
            name: longName,
            salt: 123,
            blockHeight: 99,
            autoExtend: false,
            status: 'preclaimed',
            ...fields,
          },
        },
      },
    });

    it.each([
      ['cannot be reached', restError('Error sending request: Failed to fetch', { code: 'REQUEST_SEND_ERROR' })],
      ['is unavailable', restError('v3/transactions error: 503 status code', { statusCode: 503 })],
    ])('keeps the claim to retry when the node %s', async (_, error) => {
      const {
        aeNames,
        nameClaim,
        openDefaultModal,
        sdk,
      } = await createTestContext(queuedClaim());
      nameClaim.mockRejectedValueOnce(error);

      await aeNames.claimPreclaimedNames();

      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status: 'preclaimed',
        salt: 123,
      });
      expect(openDefaultModal).not.toHaveBeenCalled();

      await aeNames.claimPreclaimedNames();

      expect(nameClaim).toHaveBeenCalledTimes(2);
      expect(sdk.poll).toHaveBeenCalledWith('th_claim');
    });

    it('drops the claim the node rejects', async () => {
      const { aeNames, nameClaim, openDefaultModal } = await createTestContext(queuedClaim());
      nameClaim.mockRejectedValueOnce(restError('v3/transactions error: Invalid tx', { statusCode: 400 }));

      await aeNames.claimPreclaimedNames();

      expect(aeNames.preclaimedNames.value).toEqual({});
      expect(openDefaultModal).toHaveBeenCalledWith({
        icon: 'critical',
        msg: 'v3/transactions error: Invalid tx',
      });
    });

    it('keeps a sent claim when its status cannot be read', async () => {
      const { aeNames, openDefaultModal, sdk } = await createTestContext(queuedClaim({
        status: 'claim-submitted',
        claimTxHash: 'th_existing',
      }));
      sdk.poll.mockRejectedValueOnce(restError('Error sending request: Failed to fetch', { code: 'REQUEST_SEND_ERROR' }));

      await aeNames.claimPreclaimedNames();

      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status: 'claim-submitted',
        claimTxHash: 'th_existing',
      });
      expect(openDefaultModal).not.toHaveBeenCalled();
    });

    const nameTakenModal = expect.objectContaining({ msg: expect.stringContaining('already') });

    it('finishes the claim of a failed run that was mined, pointing the name to the account', async () => {
      const {
        aeNames,
        fetchAllPages,
        nameClaim,
        nameGetState,
        nameUpdate,
        openDefaultModal,
        sdk,
      } = await createTestContext(queuedClaim({ autoExtend: true }));
      nameGetState.mockResolvedValueOnce({ owner: 'ak_test' });
      fetchAllPages.mockResolvedValue([middlewareName(longName)]);

      await aeNames.claimPreclaimedNames();

      expect(nameClaim).not.toHaveBeenCalled();
      expect(sdk.poll).not.toHaveBeenCalled();
      expect(nameUpdate).toHaveBeenCalledWith(
        { account_pubkey: 'ak_test' },
        { extendPointers: true },
      );
      expect(aeNames.ownedNames.value).toEqual([
        expect.objectContaining({ name: longName, autoExtend: true }),
      ]);
      expect(openDefaultModal).not.toHaveBeenCalledWith(nameTakenModal);
    });

    it('updates the pointer of a claim found mined again after it failed', async () => {
      const {
        aeNames,
        nameGetState,
        nameUpdate,
        sdk,
      } = await createTestContext(queuedClaim());
      nameGetState.mockResolvedValueOnce({ owner: 'ak_test' });
      nameUpdate.mockRejectedValueOnce(new Error('pointer failed'));

      await aeNames.claimPreclaimedNames();
      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status: 'pointer-update-pending',
      });

      await aeNames.claimPreclaimedNames();

      expect(nameUpdate).toHaveBeenCalledTimes(2);
      expect(sdk.poll).not.toHaveBeenCalled();
      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status: 'claimed',
      });
    });

    it('keeps the claim to retry when the name can\'t be looked up', async () => {
      const {
        aeNames,
        nameClaim,
        nameGetState,
        openDefaultModal,
      } = await createTestContext(queuedClaim());
      nameGetState.mockRejectedValueOnce(restError('v3/names error: 503 status code', { statusCode: 503 }));

      await aeNames.claimPreclaimedNames();

      expect(nameClaim).not.toHaveBeenCalled();
      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status: 'preclaimed',
        salt: 123,
      });
      expect(openDefaultModal).not.toHaveBeenCalled();
    });

    describe('of an auction name', () => {
      const shortName = 'short.chain';
      const queuedAuctionClaim = {
        preclaimedNames: {
          ae_testnet: {
            [shortName]: {
              address: 'ak_test',
              name: shortName,
              salt: 123,
              blockHeight: 99,
              autoExtend: false,
              status: 'preclaimed',
            },
          },
        },
      };

      it('claims a name nobody bids on yet', async () => {
        const { aeNames, nameClaim, sdk } = await createTestContext(queuedAuctionClaim);

        await aeNames.claimPreclaimedNames();

        expect(sdk.api.getAuctionEntryByName).toHaveBeenCalledWith(shortName);
        expect(nameClaim).toHaveBeenCalledTimes(1);
      });

      // A claim with a salt is refused once the name is in auction
      it.each([
        ['the account, from a failed run', 'ak_test', false],
        ['another account', 'ak_other', true],
      ])('does not claim it again when %s has the highest bid', async (_, highestBidder, isTaken) => {
        const {
          aeNames,
          nameClaim,
          openDefaultModal,
          sdk,
        } = await createTestContext(queuedAuctionClaim);
        sdk.api.getAuctionEntryByName.mockResolvedValue({ highestBidder, highestBid: 1n });

        await aeNames.claimPreclaimedNames();

        expect(nameClaim).not.toHaveBeenCalled();
        expect(aeNames.preclaimedNames.value).toEqual({});
        expect(openDefaultModal).toHaveBeenCalledTimes(isTaken ? 1 : 0);
      });
    });

    it.each([
      ['preclaimed', {}],
      ['preclaim-submitted', { preclaimTxHash: 'th_preclaim' }],
    ])('leaves a %s entry of a network switched away from mid-queue', async (status, fields) => {
      const {
        aeNames,
        getAeSdk,
        nameClaim,
        nameGetState,
        nodeNetworkId,
        openDefaultModal,
        sdk,
      } = await createTestContext(queuedClaim({ status, ...fields }));
      sdk.api.getTransactionByHash = vi.fn()
        .mockRejectedValue(restError('Transaction not found', { statusCode: 404 }));
      // The queue starts on the testnet, the switch settles before the entry is handled
      getAeSdk
        .mockImplementationOnce(async () => sdk)
        .mockImplementationOnce(async () => {
          nodeNetworkId.value = 'ae_mainnet';
          return sdk;
        });

      await aeNames.claimPreclaimedNames();

      expect(sdk.api.getTransactionByHash).not.toHaveBeenCalled();
      expect(nameGetState).not.toHaveBeenCalled();
      expect(nameClaim).not.toHaveBeenCalled();
      expect(aeNames.preclaimedNames.value.ae_testnet[longName]).toMatchObject({
        status,
        salt: 123,
      });
      expect(openDefaultModal).not.toHaveBeenCalled();
    });

    it('calls the name taken when another account registered it', async () => {
      const { aeNames, nameGetState, openDefaultModal } = await createTestContext(queuedClaim());
      nameGetState.mockResolvedValueOnce({ owner: 'ak_other' });

      await aeNames.claimPreclaimedNames();

      expect(aeNames.preclaimedNames.value).toEqual({});
      expect(openDefaultModal).toHaveBeenCalledWith(nameTakenModal);
    });
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
    activeFrom: 1,
    expireHeight: 150,
    ownership: { current: owner },
    pointers: [{ key: 'account_pubkey', id: owner, encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR' }],
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
    const { aeNames } = await createTestContext({
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
      // The app started again while the transfer is pending
      setUpStartup: (startup) => {
        startup.fetchAllPages.mockReset().mockResolvedValue([middlewareName(pendingName)]);
        startup.fetchPendingTransactions.mockResolvedValue([{
          hash: pendingTxHash,
          tx: {
            type: 'NameTransferTx',
            accountId: 'ak_test',
            name: pendingName,
          },
        }]);
      },
    });

    await aeNames.updateOwnedNames();

    expect(aeNames.ownedNames.value[0]).toMatchObject({
      name: pendingName,
      pending: true,
      pendingStatus: 'transferring',
    });
  });

  it('clears stale transfer state when the old owner still owns the name and tx is gone', async () => {
    const pendingName = 'transfer.chain';
    const { aeNames, getPendingNameTransferTxs } = await createTestContext({
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
      // The app started again after the transfer was dropped
      setUpStartup: (startup) => {
        startup.fetchAllPages.mockReset().mockResolvedValue([middlewareName(pendingName)]);
      },
    });

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

describe('useAeNames changeDefaultName (set/clear the preferred name)', () => {
  it('sets the default via the signed link flow and applies it optimistically', async () => {
    const ctx = await createTestContext();
    ctx.getPreferredName.mockResolvedValue(undefined); // link tx not mined yet

    await ctx.aeNames.changeDefaultName('picked.chain');

    expect(ctx.linkPreferredAensName).toHaveBeenCalledWith('ak_test', 'picked.chain');
    expect(ctx.unlinkPreferredAensName).not.toHaveBeenCalled();
    // Visible immediately, before the on-chain poll reflects it.
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('picked.chain');
    // The in-flight marker is released once the flow settles.
    expect(ctx.aeNames.settingDefaultName.value).toBeNull();
  });

  it('clears the default via the signed unlink flow', async () => {
    const ctx = await createTestContext();
    ctx.aeNames.setDefaultNameOptimistic({ address: 'ak_test', name: 'old.chain' });

    await ctx.aeNames.changeDefaultName('');

    expect(ctx.unlinkPreferredAensName).toHaveBeenCalledWith('ak_test');
    expect(ctx.linkPreferredAensName).not.toHaveBeenCalled();
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('');
  });

  it('drops a concurrent set-default (any row of the account) while one is in flight', async () => {
    const ctx = await createTestContext();
    let resolveLink;
    ctx.linkPreferredAensName.mockReturnValue(new Promise((resolve) => { resolveLink = resolve; }));

    const first = ctx.aeNames.changeDefaultName('one.chain');
    // Competing calls that would race the contract's per-address nonce are ignored.
    await ctx.aeNames.changeDefaultName('two.chain');
    await ctx.aeNames.changeDefaultName('three.chain');
    expect(ctx.aeNames.settingDefaultName.value).toMatchObject({ address: 'ak_test', name: 'one.chain' });

    resolveLink('th_link');
    await first;

    expect(ctx.linkPreferredAensName).toHaveBeenCalledTimes(1);
    expect(ctx.linkPreferredAensName).toHaveBeenCalledWith('ak_test', 'one.chain');
    expect(ctx.aeNames.settingDefaultName.value).toBeNull();
  });

  it('does nothing on a network without an AddressLink deployment', async () => {
    const ctx = await createTestContext();
    ctx.isAddressLinkSupported.value = false;

    await ctx.aeNames.changeDefaultName('picked.chain');

    expect(ctx.linkPreferredAensName).not.toHaveBeenCalled();
    expect(ctx.unlinkPreferredAensName).not.toHaveBeenCalled();
  });

  /** Store a default via the poll, so the tests below start from a real stored value. */
  const storeDefaultName = async (ctx, name) => {
    ctx.getPreferredName.mockResolvedValue(name);
    await ctx.aeNames.updateDefaultNames();
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe(name);
  };

  it('keeps stored defaults when polling a network without a deployment', async () => {
    // No source of truth on such a network, so the poll must not run at all.
    const ctx = await createTestContext();
    await storeDefaultName(ctx, 'stored.chain');

    ctx.isAddressLinkSupported.value = false;
    ctx.getPreferredName.mockClear();
    ctx.getPreferredName.mockResolvedValue(undefined);

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.getPreferredName).not.toHaveBeenCalled();
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('stored.chain');
  });

  it('re-reads the deployment gate after the network switch settles', async () => {
    // Mid-switch `isAddressLinkSupported` still reflects the network being left, so the
    // gate has to be read after `getAeSdk()`; reading it before wrote `undefined`
    // through and deleted the default stored for the network being joined.
    const ctx = await createTestContext();
    await storeDefaultName(ctx, 'stored.chain');

    ctx.getPreferredName.mockClear();
    ctx.getPreferredName.mockResolvedValue(undefined);
    ctx.getAeSdk.mockImplementation(async () => {
      ctx.isAddressLinkSupported.value = false;
      return ctx.sdk;
    });

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.getPreferredName).not.toHaveBeenCalled();
    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('stored.chain');
  });

  it('keeps stored defaults when the contract read fails', async () => {
    const ctx = await createTestContext();
    await storeDefaultName(ctx, 'stored.chain');

    ctx.getPreferredName.mockRejectedValue(new Error('dry-run unavailable'));

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('stored.chain');
  });

  it('keeps the stored default when support drops mid-fetch, not just before it', async () => {
    // The existing "re-reads the deployment gate" test above covers support dropping
    // before `getPreferredName` is ever called. This covers it dropping *during* the
    // call (the per-account loop only re-checks `nodeNetworkId`, not this flag) - a
    // real window since each account does its own network round trip.
    const ctx = await createTestContext();
    await storeDefaultName(ctx, 'stored.chain');

    ctx.getPreferredName.mockClear();
    ctx.getPreferredName.mockImplementation(async () => {
      ctx.isAddressLinkSupported.value = false;
      return undefined;
    });

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('stored.chain');
  });

  it('clears the stored default when the chain reports no preferred name', async () => {
    // The other side of the coin: a successful read of an empty link is a genuine
    // unlink and must still propagate, so the fix above cannot over-reach.
    const ctx = await createTestContext();
    await storeDefaultName(ctx, 'stored.chain');

    ctx.getPreferredName.mockResolvedValue(undefined);

    await ctx.aeNames.updateDefaultNames();

    expect(ctx.aeNames.getDefaultName('ak_test').value).toBe('');
  });
});

describe('useAeNames last-claimed-name fallback', () => {
  /** Middleware-shaped name; `activeFrom` becomes the claim height (`createdAtHeight`). */
  const middlewareName = (name, activeFrom, owner = 'ak_test') => ({
    activeFrom,
    expireHeight: 50000,
    ownership: { current: owner },
    pointers: [{ key: 'account_pubkey', id: owner, encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR' }],
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

  it('lets the newest owned-name fetch win when an older one finishes last', async () => {
    const ctx = await createTestContext();
    ctx.fetchAllPages.mockClear();

    let releaseStale;
    const staleDone = new Promise((resolve) => { releaseStale = resolve; });
    ctx.fetchAllPages
      .mockImplementationOnce(async () => {
        await staleDone;
        return [middlewareName('stale.chain', 10)];
      })
      .mockImplementationOnce(async () => [middlewareName('fresh.chain', 30)]);

    const stale = ctx.aeNames.updateOwnedNames();
    const fresh = ctx.aeNames.updateOwnedNames();
    await fresh;
    releaseStale();
    await stale;

    expect(ctx.fetchAllPages).toHaveBeenCalledTimes(2);
    expect(ctx.aeNames.getName('ak_test').value).toBe('fresh.chain');
  });

  it('publishes each run that finishes newer than the last published one', async () => {
    // The Names page polls every 10s regardless of whether a run is still going. Gating
    // the publish on "no newer run exists" froze the list (and the spinner) for as long
    // as the poll outpaced the fetch, because at completion a newer run always existed.
    const ctx = await createTestContext();
    ctx.fetchAllPages.mockClear();

    let releaseFirst;
    let releaseSecond;
    const first = new Promise((resolve) => { releaseFirst = resolve; });
    const second = new Promise((resolve) => { releaseSecond = resolve; });
    ctx.fetchAllPages
      .mockImplementationOnce(async () => {
        await first;
        return [middlewareName('first.chain', 10)];
      })
      .mockImplementationOnce(async () => {
        await second;
        return [middlewareName('second.chain', 30)];
      });

    const runA = ctx.aeNames.updateOwnedNames();
    const runB = ctx.aeNames.updateOwnedNames();

    releaseFirst();
    await runA;
    expect(ctx.aeNames.getName('ak_test').value).toBe('first.chain');
    expect(ctx.aeNames.areNamesFetching.value).toBe(true);

    releaseSecond();
    await runB;
    expect(ctx.aeNames.getName('ak_test').value).toBe('second.chain');
    expect(ctx.aeNames.areNamesFetching.value).toBe(false);
  });

  it('clears the fetching flag when a run fails', async () => {
    // The flag also gates the Names page poll, so leaking it true there stops the page
    // refreshing for the rest of the session.
    const ctx = await createTestContext();
    ctx.fetchAllPages.mockRejectedValueOnce(new Error('middleware unreachable'));

    await ctx.aeNames.updateOwnedNames();

    expect(ctx.aeNames.areNamesFetching.value).toBe(false);
  });

  it('waits for the network id before the startup fetch, then fetches once', async () => {
    // Fetching before the id resolves keys the whole result under `undefined`.
    const ctx = await createTestContext({
      networkId: null,
      startupNames: [middlewareName('claimed.chain', 30)],
    });
    expect(ctx.aeNames.ownedNames.value).toEqual([]);

    ctx.nodeNetworkId.value = 'ae_testnet';

    await vi.waitFor(() => {
      expect(ctx.aeNames.getName('ak_test').value).toBe('claimed.chain');
    });
    expect(ctx.fetchAllPages).toHaveBeenCalledTimes(1);
  });

  it('keys owned names to the network the switch settles on, not the one it left', async () => {
    // A switch settles asynchronously; `getAeSdk` is what makes the fetch wait for it.
    const ctx = await createTestContext();

    let settleSwitch;
    const switched = new Promise((resolve) => { settleSwitch = resolve; });
    setTimeout(() => {
      ctx.nodeNetworkId.value = 'ae_mainnet';
      settleSwitch();
    }, 0);
    ctx.getAeSdk.mockImplementation(async () => { await switched; return ctx.sdk; });
    ctx.fetchAllPages.mockImplementation(async () => {
      await switched;
      return [middlewareName('claimed.chain', 30)];
    });

    await ctx.aeNames.updateOwnedNames();

    expect(ctx.aeNames.getName('ak_test').value).toBe('claimed.chain');
  });

  it('loads owned names on startup, without opening the Names page', async () => {
    // The account-card carousel scenario: no explicit updateOwnedNames() call, which is
    // what visiting the Names page does.
    const ctx = await createTestContext({ startupNames: [middlewareName('claimed.chain', 30)] });

    expect(ctx.aeNames.getName('ak_test').value).toBe('claimed.chain');
  });

  it('loads the default names on startup', async () => {
    const ctx = await createTestContext({ preferredName: 'linked.chain' });

    await vi.waitFor(() => expect(ctx.aeNames.getName('ak_test').value).toBe('linked.chain'));
  });

  it('shows the stored names in a request popup, without loading them', async () => {
    const ctx = await createTestContext({
      runningInPopup: true,
      storedOwnedNames: [{
        name: 'stored.chain',
        hash: 'nm_stored',
        owner: 'ak_test',
        createdAtHeight: 20,
        expiresAt: 50000,
        pointers: { accountPubkey: 'ak_test' },
      }],
      startupNames: [middlewareName('claimed.chain', 30)],
      preferredName: 'linked.chain',
    });

    expect(ctx.aeNames.getName('ak_test').value).toBe('stored.chain');
  });

  it('loads the owned names once the imported accounts are decrypted too', async () => {
    const ctx = await createTestContext({ accounts: [], accountsReady: false });

    ctx.aeAccounts.value = [{ address: 'ak_test' }]; // unlocked
    await flushAsync();
    ctx.aeAccounts.value = [{ address: 'ak_test' }, { address: 'ak_imported' }];
    ctx.areAccountsReady.value = true;
    await vi.waitFor(() => expect(ctx.fetchAllPages).toHaveBeenCalledTimes(2));
    await flushAsync();

    expect(ctx.fetchAllPages).toHaveBeenCalledTimes(2);
  });

  it('loads the owned names once per network switch', async () => {
    const ctx = await createTestContext({ networkId: 'ae_mainnet' });
    const { NETWORK_NAME_TESTNET } = await import('@/constants');
    const { useNetworks } = await import('@/composables/networks');
    ctx.fetchAllPages.mockResolvedValue([middlewareName('switched.chain', 30)]);

    useNetworks().switchNetwork(NETWORK_NAME_TESTNET);
    ctx.nodeNetworkId.value = 'ae_testnet'; // the node of the new network
    await flushAsync();
    await vi.waitFor(() => expect(ctx.aeNames.areNamesFetching.value).toBe(false));
    await flushAsync();

    expect(ctx.aeNames.getName('ak_test').value).toBe('switched.chain');
    expect(ctx.fetchAllPages).toHaveBeenCalledTimes(1);
  });

  it('loads the owned names again only when the accounts change', async () => {
    const ctx = await createTestContext();

    // A new list of the same accounts, as when an account of another chain is added
    ctx.aeAccounts.value = [{ address: 'ak_test' }];
    await flushAsync();
    expect(ctx.fetchAllPages).not.toHaveBeenCalled();

    ctx.aeAccounts.value = [{ address: 'ak_other' }];
    await vi.waitFor(() => expect(ctx.fetchAllPages).toHaveBeenCalledTimes(1));

    ctx.aeAccounts.value = [{ address: 'ak_other' }, { address: 'ak_new' }];
    await vi.waitFor(() => expect(ctx.fetchAllPages).toHaveBeenCalledTimes(3));
  });

  it('loads every page of the active names the account owns', async () => {
    const renderedName = (name, activeFrom, pointers) => ({
      active: true,
      name,
      hash: `nm_${name}`,
      name_fee: 1771100000000000000,
      pointers,
      revoke: null,
      expire_height: 50000,
      claims_count: 1,
      auction_timeout: 0,
      auction: null,
      ownership: { current: 'ak_test', original: 'ak_original' },
      active_from: activeFrom,
      approximate_expire_time: 1826128070753,
      approximate_activation_time: 1793725969162,
    });
    const next = '/v3/names?cursor=40%3Ac2Vjb25kLmNoYWlu&limit=100&owned_by=ak_test&state=active';
    const ctx = await createTestContext({
      middlewareResponses: {
        '/v3/names?owned_by=ak_test&state=active&limit=100': JSON.stringify({
          data: [renderedName('first.chain', 30, [
            { encoded_key: 'ba_YWNjb3VudF9wdWJrZXn8jckR', id: 'ak_test', key: 'account_pubkey' },
            { encoded_key: 'ba_YWNjb3VudF9wdWJrZXlfiWr7Uw==', id: 'ak_other', key: 'account_pubkey_' },
          ])],
          next,
        }),
        [next]: JSON.stringify({ data: [renderedName('second.chain', 40, [])], next: null }),
      },
    });

    expect(ctx.aeNames.ownedNames.value.map(({
      name, hash, owner, createdAtHeight, expiresAt, pointers,
    }) => ({
      name, hash, owner, createdAtHeight, expiresAt, pointers,
    }))).toEqual([{
      name: 'first.chain',
      hash: 'nm_first.chain',
      owner: 'ak_test',
      createdAtHeight: 30,
      expiresAt: 50000,
      pointers: { accountPubkey: 'ak_test', 'ba_YWNjb3VudF9wdWJrZXlfiWr7Uw==': 'ak_other' },
    }, {
      name: 'second.chain',
      hash: 'nm_second.chain',
      owner: 'ak_test',
      createdAtHeight: 40,
      expiresAt: 50000,
      pointers: {},
    }]);
  });

  it('keeps the pointers of a name by their camelCased key', async () => {
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [{
      ...middlewareName('pointing.chain', 30),
      pointers: [
        { key: 'account_pubkey', id: 'ak_test', encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR' },
        { key: 'contract_pubkey', id: 'ct_test', encodedKey: 'ba_Y29udHJhY3RfcHVia2V5OCcARA==' },
        { key: 'oracle_pubkey', id: 'ok_test', encodedKey: 'ba_b3JhY2xlX3B1YmtleV2vKNs=' },
        { key: 'channel', id: 'ch_test', encodedKey: 'ba_Y2hhbm5lbG7hYdQ=' },
      ],
    }]);

    expect(ctx.aeNames.ownedNames.value[0]).toMatchObject({
      name: 'pointing.chain',
      owner: 'ak_test',
      createdAtHeight: 30,
      expiresAt: 50000,
    });
    expect(ctx.aeNames.ownedNames.value[0].pointers).toEqual({
      accountPubkey: 'ak_test',
      contractPubkey: 'ct_test',
      oraclePubkey: 'ok_test',
      channel: 'ch_test',
    });
  });

  it('keeps the other pointers by their encoded key, so none passes for the account', async () => {
    // A name pushed to the account by a transfer, pointing to someone else
    const ctx = await createTestContext();
    await publishOwnedNames(ctx, [{
      ...middlewareName('pushed.chain', 30),
      pointers: [
        { key: 'account_pubkey', id: 'ak_other', encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR' },
        { key: 'account_pubkey_', id: 'ak_test', encodedKey: 'ba_YWNjb3VudF9wdWJrZXlfiWr7Uw==' },
        { key: 'accountPubkey', id: 'ak_test', encodedKey: 'ba_YWNjb3VudFB1YmtleRNQC1g=' },
        { key: 'ACCOUNT_PUBKEY', id: 'ak_test', encodedKey: 'ba_QUNDT1VOVF9QVUJLRVknItpB' },
      ],
    }]);

    expect(ctx.aeNames.ownedNames.value[0].pointers).toEqual({
      accountPubkey: 'ak_other',
      'ba_YWNjb3VudF9wdWJrZXlfiWr7Uw==': 'ak_test',
      'ba_YWNjb3VudFB1YmtleRNQC1g=': 'ak_test',
      ba_QUNDT1VOVF9QVUJLRVknItpB: 'ak_test',
    });
  });

  it('resolves a name hash once', async () => {
    const ctx = await createTestContext();
    ctx.fetchNameByHash.mockResolvedValue('hashed.chain');

    expect(await ctx.aeNames.getNameByNameHash('nm_hashed')).toBe('hashed.chain');
    expect(await ctx.aeNames.getNameByNameHash('nm_hashed')).toBe('hashed.chain');
    expect(ctx.fetchNameByHash).toHaveBeenCalledTimes(1);
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

describe('useAeNames fetchNameAuction', () => {
  // As the middleware renders them, with amounts too big for a JS number
  const AUCTION = '{"name":"test.chain","activation_time":1793725969162,"auction_end":1000,'
    + '"approximate_expire_time":1826128070753,"name_fee":352380000000000000000,'
    + '"last_bid":{"hash":"th_carol","tx":{"account_id":"ak_carol","name":"test.chain",'
    + '"name_fee":500000000000000000001,"type":"NameClaimTx"}},"claims_count":3}';
  const CLAIMS = '/v3/names/auctions/test.chain/claims?limit=100';
  const claim = (accountId, nameFee, internalSource = false) => JSON.stringify({
    height: 900,
    block_hash: 'mh_block',
    source_tx_hash: `th_${accountId}`,
    source_tx_type: internalSource ? 'ContractCallTx' : 'NameClaimTx',
    internal_source: internalSource,
    tx: {
      account_id: accountId,
      fee: 16500000000000,
      name: 'test.chain',
      name_fee: 'NAME_FEE',
      name_salt: 0,
      nonce: 1,
    },
  }).replace('"NAME_FEE"', nameFee); // unquoted, as the middleware has it
  const claimsPage = (claims, next = null) => (
    `{"data":[${claims.join()}],"next":${JSON.stringify(next)}}`
  );
  const auctionResponses = (claims) => ({
    '/v3/names/auctions/test.chain': AUCTION,
    [CLAIMS]: claimsPage(claims),
  });

  async function fetchAuction(ctx) {
    const auction = await ctx.aeNames.fetchNameAuction('test.chain');
    ctx.aeNames.setAuctionEntry({ name: 'test.chain', ...auction });
    return auction;
  }

  it('takes the bids from every page of the claims, also those made through a contract call', async () => {
    const nextClaims = '/v3/names/auctions/test.chain/claims?cursor=8962914&limit=100';
    const ctx = await createTestContext({
      middlewareResponses: {
        ...auctionResponses([]),
        [CLAIMS]: claimsPage([
          claim('ak_carol', '500000000000000000001'),
          claim('ak_dave', '450000000000000000000', true),
        ], nextClaims),
        [nextClaims]: claimsPage([claim('ak_alice', '352380000000000000001')]),
      },
    });

    const auction = await fetchAuction(ctx);

    expect(auction.expiration).toBe(1000);
    expect(auction.bids.map(({ accountId, nameFee }) => [accountId, nameFee.toFixed()]))
      .toEqual([
        ['ak_carol', '500.000000000000000001'],
        ['ak_dave', '450'],
        ['ak_alice', '352.380000000000000001'],
      ]);
    expect(ctx.aeNames.getNameAuctionHighestBid('test.chain').accountId).toBe('ak_carol');
  });

  it('keeps the name in its path segment', async () => {
    // A name from the route, which would otherwise page through another endpoint
    const ctx = await createTestContext({
      middlewareResponses: {
        '/v3/names/auctions/..%2F..%2Fkey-blocks%23': AUCTION,
        '/v3/names/auctions/..%2F..%2Fkey-blocks%23/claims?limit=100': claimsPage([]),
      },
    });

    const auction = await ctx.aeNames.fetchNameAuction('../../key-blocks#');

    expect(auction.expiration).toBe(1000);
  });

  it('takes the highest bid from the node, which can be ahead of the middleware', async () => {
    const ctx = await createTestContext({
      middlewareResponses: auctionResponses([claim('ak_carol', '500000000000000000000')]),
    });
    ctx.sdk.api.getAuctionEntryByName.mockResolvedValue({
      highestBidder: 'ak_erin',
      highestBid: 600000000000000000001n,
    });

    await fetchAuction(ctx);

    expect(ctx.sdk.api.getAuctionEntryByName).toHaveBeenCalledWith('test.chain');
    const highestBid = ctx.aeNames.getNameAuctionHighestBid('test.chain');
    expect([highestBid.accountId, highestBid.nameFee.toFixed()])
      .toEqual(['ak_erin', '600.000000000000000001']);
  });

  it('has no highest bid when the middleware lists no bid yet and the node can\'t tell', async () => {
    const ctx = await createTestContext({ middlewareResponses: auctionResponses([]) });

    const auction = await fetchAuction(ctx);

    expect(auction.bids).toEqual([]);
    expect(ctx.aeNames.getNameAuctionHighestBid('test.chain')).toBeUndefined();
  });
});
