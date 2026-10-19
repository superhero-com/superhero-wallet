// @ts-nocheck
import { ref } from 'vue';
import {
  buildTxHash,
  commitmentHash,
  ConsensusProtocolVersion,
  decode,
  hash as blake2bHash,
  MemoryAccount,
  produceNameId,
  rebuildUnpackedTx,
  Tag,
  unpackTx,
  verify,
} from '@aeternity/aepp-sdk';
import { restError } from '../../../helpers/restError';

/**
 * The name transactions built and signed by the real SDK `Name`, posted to a node double.
 * `aeNames.spec.js` covers the queue logic with `Name` mocked.
 */
const NAME = 'verylongsupername.chain';
const NETWORK_ID = 'ae_uat';
const TOP_HEIGHT = 100;

const activeAccount = MemoryAccount.generate();
const otherAccount = MemoryAccount.generate();
const recipient = MemoryAccount.generate().address;
const keys = Object.fromEntries([activeAccount, otherAccount].map((account) => [
  account.address,
  account,
]));

function createNode() {
  const posted = [];
  const node = {
    posted,
    getNodeInfo: async () => ({
      nodeNetworkId: NETWORK_ID,
      consensusProtocolVersion: ConsensusProtocolVersion.Arcus,
    }),
    getNetworkId: async () => NETWORK_ID,
    getAccountNextNonce: async () => ({ nextNonce: 5 }),
    getRecentGasPrices: async () => [1, 5, 15, 30, 60]
      .map((minutes) => ({ minGasPrice: 1000000000n, minutes, utilization: 0 })),
    getTopHeader: async () => ({ height: TOP_HEIGHT }),
    getCurrentKeyBlockHeight: async () => ({ height: TOP_HEIGHT }),
    postTransaction: async ({ tx }) => {
      posted.push(tx);
      return { txHash: buildTxHash(tx) };
    },
    getTransactionByHash: async (hash) => ({ hash, blockHeight: TOP_HEIGHT, tx: {} }),
    nameEntry: null,
    getNameEntryByName: async () => {
      if (!node.nameEntry) {
        throw restError('v3/names/verylongsupername.chain error: Name not found', { statusCode: 404 });
      }
      return node.nameEntry;
    },
  };
  return node;
}

/** What the node answers for a registered name */
const nameEntry = (owner, pointers = []) => ({
  id: 'nm_2',
  owner,
  ttl: TOP_HEIGHT + 50,
  pointers,
});

/** The transactions the node got, unwrapped from their signatures. */
const postedTxs = (node) => node.posted.map((tx) => unpackTx(tx, Tag.SignedTx).encodedTx);

/** Signed with the key of `address` for this network, as the node checks it */
function isSignedBy(signedTx, address) {
  const { encodedTx, signatures: [signature] } = unpackTx(signedTx, Tag.SignedTx);
  const txHash = blake2bHash(decode(rebuildUnpackedTx(encodedTx)));
  return verify(Buffer.concat([Buffer.from(NETWORK_ID), txHash]), signature, address);
}

async function createContext({ preclaimedNames = {}, ownedNames = [] } = {}) {
  vi.resetModules();
  localStorage.clear();

  const node = createNode();
  const sdk = {
    // As `AeSdkBase.getContext`; transactions are built as without `verify`
    getContext: (mergeWith = {}) => ({
      onNode: node,
      onAccount: activeAccount,
      verify: false,
      ...mergeWith,
    }),
    getHeight: vi.fn().mockResolvedValue(TOP_HEIGHT),
    poll: vi.fn().mockResolvedValue({}),
    api: node,
  };
  const openDefaultModal = vi.fn();

  vi.doMock('@/utils', async () => ({
    ...(await vi.importActual('@/utils')),
    decryptedComputed: (_key, encryptedState) => encryptedState,
    fetchAllPages: vi.fn().mockResolvedValue([]),
  }));
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({
      aeAccounts: ref([{ address: activeAccount.address }, { address: otherAccount.address }]),
      activeAccount: ref({ address: activeAccount.address }),
      isLocalAccountAddress: () => true,
      getLastActiveProtocolAccount: () => ({ address: activeAccount.address }),
    }),
  }));
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({ nodeNetworkId: ref(NETWORK_ID), getAeSdk: async () => sdk }),
  }));
  vi.doMock('@/composables/auth', () => ({
    useAuth: () => ({ encryptionKey: ref('irrelevant-key-decryptedComputed-is-a-passthrough') }),
  }));
  vi.doMock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal }) }));
  vi.doMock('@/composables/topHeader', () => ({
    useTopHeaderData: () => ({ topBlockHeight: ref(TOP_HEIGHT) }),
  }));
  vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
  // Signs with the key of the account it is asked for, as the wallet's own signer does
  vi.doMock('@/protocols/aeternity/libs/AeAccountHdWallet', () => ({
    AeAccountHdWallet: class {
      sign = vi.fn();

      unsafeSign = vi.fn();

      // eslint-disable-next-line class-methods-use-this
      signTransaction(tx, { fromAccount, networkId }) {
        return keys[fromAccount].signTransaction(tx, { networkId });
      }
    },
  }));
  vi.doMock('@/protocols/aeternity/composables/aeMiddleware', () => ({
    useAeMiddleware: () => ({
      isMiddlewareReady: ref(false),
      getMiddleware: vi.fn().mockResolvedValue({ getNames: vi.fn().mockResolvedValue([]) }),
      fetchFromMiddlewareCamelCased: vi.fn(),
      fetchFromMiddlewareCamelCasedPrecise: vi.fn(),
    }),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkContract', () => ({
    useAeAddressLinkContract: () => ({
      getPreferredName: vi.fn().mockResolvedValue(undefined),
      isAddressLinkSupported: ref(false),
    }),
  }));
  vi.doMock('@/protocols/aeternity/composables/aeAddressLinkBackend', () => ({
    useAeAddressLinkBackend: () => ({
      linkPreferredAensName: vi.fn(),
      unlinkPreferredAensName: vi.fn(),
    }),
  }));

  // Before `registerAdapters`, which loads `aeNames.ts` and its storage refs on the way.
  const { WalletStorage } = await import('@/lib/WalletStorage');
  const { STORAGE_KEYS } = await import('@/constants');
  WalletStorage.set(STORAGE_KEYS.preclaimedNames, JSON.stringify(preclaimedNames));
  WalletStorage.set(STORAGE_KEYS.namesOwned, ownedNames);
  WalletStorage.set(STORAGE_KEYS.namesOwnedNetworkId, NETWORK_ID);

  await import('@/protocols/registerAdapters');
  const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
  vi.spyOn(ProtocolAdapterFactory.getAdapter('aeternity'), 'fetchPendingTransactions')
    .mockResolvedValue([]);

  const aeNamesModule = await import('@/protocols/aeternity/composables/aeNames');
  const aeNames = aeNamesModule.useAeNames({ pollingDisabled: true });
  await new Promise((resolve) => { setTimeout(resolve, 0); });

  return {
    aeNames,
    node,
    openDefaultModal,
    NAME_CLAIM_STATUS: aeNamesModule.NAME_CLAIM_STATUS,
    /** As written to the storage, which settles a tick after the change */
    getStoredEntry: () => {
      const stored = JSON.parse(WalletStorage.get(STORAGE_KEYS.preclaimedNames) || '{}');
      return stored[NETWORK_ID]?.[NAME];
    },
  };
}

describe('useAeNames with the real SDK', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preclaims for the chosen account with the salt it stores', async () => {
    const ctx = await createContext();

    expect(await ctx.aeNames.addNameToClaimQueue(NAME, otherAccount.address, false)).toBe(true);

    const [preclaimTx] = postedTxs(ctx.node);
    await vi.waitFor(() => expect(ctx.getStoredEntry()).toBeDefined());
    const entry = ctx.getStoredEntry();
    expect(preclaimTx.tag).toBe(Tag.NamePreclaimTx);
    expect(preclaimTx.accountId).toBe(otherAccount.address);
    expect(isSignedBy(ctx.node.posted[0], otherAccount.address)).toBe(true);
    expect(isSignedBy(ctx.node.posted[0], activeAccount.address)).toBe(false);
    expect(preclaimTx.commitmentId).toBe(commitmentHash(NAME, entry.salt));
    expect(entry.address).toBe(otherAccount.address);
    expect(ctx.openDefaultModal).not.toHaveBeenCalled();
  });

  it('claims with the stored salt for the chosen account, then points the name to it', async () => {
    const ctx = await createContext({
      preclaimedNames: {
        [NETWORK_ID]: {
          [NAME]: {
            address: otherAccount.address,
            name: NAME,
            salt: 4242,
            blockHeight: TOP_HEIGHT - 10,
            autoExtend: false,
            status: 'preclaimed',
          },
        },
      },
    });
    const { postTransaction } = ctx.node;
    ctx.node.postTransaction = async (body) => {
      ctx.node.nameEntry = nameEntry(otherAccount.address);
      return postTransaction(body);
    };

    await ctx.aeNames.claimPreclaimedNames();

    const [claimTx, updateTx] = postedTxs(ctx.node);
    expect(claimTx.tag).toBe(Tag.NameClaimTx);
    expect(String(claimTx.nameSalt)).toBe('4242');
    expect(claimTx.accountId).toBe(otherAccount.address);
    expect(claimTx.name).toBe(NAME);
    expect(updateTx.tag).toBe(Tag.NameUpdateTx);
    expect(updateTx.accountId).toBe(otherAccount.address);
    expect(updateTx.pointers).toEqual([{ key: 'account_pubkey', id: otherAccount.address }]);
    expect(ctx.node.posted.every((tx) => isSignedBy(tx, otherAccount.address))).toBe(true);
    expect(ctx.openDefaultModal).not.toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'critical' }),
    );
    // Kept until the middleware lists the name
    await vi.waitFor(() => expect(ctx.getStoredEntry()).toMatchObject({ status: 'claimed' }));
  });

  it('transfers the name to the recipient', async () => {
    const ctx = await createContext();

    await ctx.aeNames.updateNamePointer({ name: NAME, address: recipient, type: 'transfer' });

    const [transferTx] = postedTxs(ctx.node);
    expect(transferTx.tag).toBe(Tag.NameTransferTx);
    expect(transferTx.recipientId).toBe(recipient);
    expect(transferTx.accountId).toBe(activeAccount.address);
    expect(isSignedBy(ctx.node.posted[0], activeAccount.address)).toBe(true);
  });

  it('points the name to the address and keeps its other pointers', async () => {
    const ctx = await createContext();
    const contractPointer = { key: 'contract_pubkey', id: 'ct_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };
    ctx.node.nameEntry = nameEntry(activeAccount.address, [contractPointer]);

    await ctx.aeNames.updateNamePointer({ name: NAME, address: recipient });

    const [updateTx] = postedTxs(ctx.node);
    expect(updateTx.tag).toBe(Tag.NameUpdateTx);
    expect(updateTx.pointers).toEqual([contractPointer, { key: 'account_pubkey', id: recipient }]);
    expect(isSignedBy(ctx.node.posted[0], activeAccount.address)).toBe(true);
  });

  it('extends an expiring name with its owner\'s account', async () => {
    const ctx = await createContext({
      ownedNames: [{
        name: NAME,
        owner: otherAccount.address,
        autoExtend: true,
        pending: false,
        expiresAt: TOP_HEIGHT + 50,
        createdAtHeight: 1,
        pointers: {},
      }],
    });
    ctx.node.nameEntry = nameEntry(otherAccount.address);

    await ctx.aeNames.extendExpiringOwnedNames();

    const [extendTx] = postedTxs(ctx.node);
    expect(extendTx.tag).toBe(Tag.NameUpdateTx);
    expect(extendTx.accountId).toBe(otherAccount.address);
    expect(extendTx.nameId).toBe(produceNameId(NAME));
    expect(isSignedBy(ctx.node.posted[0], otherAccount.address)).toBe(true);
  });
});
