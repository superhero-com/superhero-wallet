import { mount } from '@vue/test-utils';
import { Tag } from '@aeternity/aepp-sdk';

const CALLER = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';

const unpackTx = vi.fn(() => ({ tag: Tag.ContractCallTx, callerId: 'ak_dapp', nonce: 0 }));
// The page serializes the re-pointed transaction with `rebuildUnpackedTx`, not
// `buildTx`: it already exists and must not be re-priced on the way back out.
const rebuildUnpackedTx = vi.fn((tx: any) => `tx_rebuilt:${tx.callerId}:${tx.nonce}`);

vi.mock('@aeternity/aepp-sdk', async (importOriginal) => ({
  ...await importOriginal<typeof import('@aeternity/aepp-sdk')>(),
  unpackTx: (...args: any[]) => unpackTx(...(args as [])),
  rebuildUnpackedTx: (...args: any[]) => rebuildUnpackedTx(...(args as [any])),
}));

const getAccountNextNonce = vi.fn(async () => ({ nextNonce: 7 }));
const getAccountByPubkey = vi.fn(async () => ({ nonce: 2 }));
const signTransaction = vi.fn(async (tx: string) => `sg_${tx}`);
const postTransaction = vi.fn();
const poll = vi.fn();
const openCallbackOrGoHome = vi.fn(async () => {});
let query: Record<string, string | null | string[]>;

vi.mock('vue-router', () => ({ useRoute: () => ({ query }) }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('@/lib/logger', () => ({ default: { write: vi.fn(async () => {}) } }));

vi.mock('@/composables', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/composables')>(),
  useDeepLinkApi: () => ({
    callbackOrigin: { value: undefined },
    openCallbackOrGoHome,
    setIsDeepLinkUsed: vi.fn(),
  }),
  useModals: () => ({ openDefaultModal: vi.fn(async () => {}) }),
  useUi: () => ({ setLoaderVisible: vi.fn() }),
  useAccounts: () => ({ getLastActiveProtocolAccount: () => ({ address: CALLER }) }),
  useAeSdk: () => ({
    nodeNetworkId: { value: 'ae_uat' },
    getAeSdk: async () => ({
      api: { getAccountNextNonce, getAccountByPubkey, postTransaction },
      signTransaction,
      poll,
    }),
  }),
}));

const SignTransaction = (await import('@/popup/pages/SignTransaction.vue')).default;
const Logger = (await import('@/lib/logger')).default;

const notFound = () => Object.assign(new Error('next-nonce error: Account not found'), {
  statusCode: 404,
});

async function mountAndSettle() {
  mount(SignTransaction, {
    global: { stubs: { IonPage: { template: '<div />' } } },
  });
  await vi.waitFor(() => expect(openCallbackOrGoHome).toHaveBeenCalled());
}

describe('SignTransaction.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unpackTx.mockReturnValue({ tag: Tag.ContractCallTx, callerId: 'ak_dapp', nonce: 0 });
    rebuildUnpackedTx.mockImplementation((tx: any) => `tx_rebuilt:${tx.callerId}:${tx.nonce}`);
    signTransaction.mockImplementation(async (tx: string) => `sg_${tx}`);
    getAccountNextNonce.mockResolvedValue({ nextNonce: 7 });
    query = {
      transaction: 'tx_original',
      networkId: 'ae_uat',
      'replace-caller': 'true',
    };
  });

  it('re-points the caller with a nonce that clears the mempool', async () => {
    await mountAndSettle();

    expect(getAccountNextNonce).toHaveBeenCalledWith(CALLER);
    // The chain nonce collides with anything the account still has pending.
    expect(getAccountByPubkey).not.toHaveBeenCalled();
    expect(signTransaction).toHaveBeenCalledWith(`tx_rebuilt:${CALLER}:7`, expect.anything());
  });

  it('signs with nonce 1 for an account that has never appeared on chain', async () => {
    // The node 404s rather than answering 0. Letting that escape aborted the whole
    // deep-link flow for a brand new account.
    getAccountNextNonce.mockRejectedValueOnce(notFound());

    await mountAndSettle();

    expect(signTransaction).toHaveBeenCalledWith(`tx_rebuilt:${CALLER}:1`, expect.anything());
    expect(openCallbackOrGoHome).toHaveBeenCalledWith(true, expect.anything());
  });

  it('returns the signed original transaction without submitting it when broadcast is omitted', async () => {
    query['replace-caller'] = 'false';

    await mountAndSettle();

    expect(getAccountNextNonce).not.toHaveBeenCalled();
    expect(signTransaction).toHaveBeenCalledWith('tx_original', expect.anything());
    expect(openCallbackOrGoHome).toHaveBeenCalledWith(true, { transaction: 'sg_tx_original' });
    expect(postTransaction).not.toHaveBeenCalled();
  });

  it('uses the cancel callback without signing when the network differs', async () => {
    query.networkId = 'ae_mainnet';

    await mountAndSettle();

    expect(signTransaction).not.toHaveBeenCalled();
    expect(openCallbackOrGoHome).toHaveBeenCalledExactlyOnceWith(false);
  });

  describe.each(['true', 'false'])('with replace-caller=%s', (replaceCaller) => {
    it.each([
      ['no', {}],
      ['a valueless', { transaction: null }],
      ['an empty', { transaction: '' }],
      ['a repeated', { transaction: ['tx_original', 'tx_other'] }],
    ])('uses the cancel callback without signing for %s transaction', async (_, transaction) => {
      query = { networkId: 'ae_uat', 'replace-caller': replaceCaller, ...transaction };

      await mountAndSettle();

      expect(unpackTx).not.toHaveBeenCalled();
      expect(signTransaction).not.toHaveBeenCalled();
      expect(Logger.write).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'pages.signTransaction.noTransaction' }),
      );
      expect(openCallbackOrGoHome).toHaveBeenCalledExactlyOnceWith(false);
    });
  });

  it('uses the cancel callback if polling fails after the node accepts the transaction', async () => {
    query.broadcast = 'true';
    query['replace-caller'] = 'false';
    postTransaction.mockResolvedValueOnce({ txHash: 'th_accepted' });
    poll.mockRejectedValueOnce(new Error('Node unavailable'));

    await mountAndSettle();

    expect(postTransaction).toHaveBeenCalledExactlyOnceWith({ tx: 'sg_tx_original' });
    expect(poll).toHaveBeenCalledWith('th_accepted', expect.anything());
    expect(openCallbackOrGoHome).toHaveBeenCalledExactlyOnceWith(false);
  });

  it.each(['true', 'false'])('submits and returns the hash for broadcast=%s', async (broadcast) => {
    query.broadcast = broadcast;
    query['replace-caller'] = 'false';
    postTransaction.mockResolvedValueOnce({ txHash: 'th_accepted' });

    await mountAndSettle();

    expect(postTransaction).toHaveBeenCalledExactlyOnceWith({ tx: 'sg_tx_original' });
    expect(poll).toHaveBeenCalledWith('th_accepted', expect.anything());
    expect(openCallbackOrGoHome)
      .toHaveBeenCalledExactlyOnceWith(true, { 'transaction-hash': 'th_accepted' });
  });

  it('signs an inner transaction for a sponsor without submitting it', async () => {
    query.innerTx = 'true';
    query['replace-caller'] = 'false';

    await mountAndSettle();

    expect(signTransaction)
      .toHaveBeenCalledWith('tx_original', expect.objectContaining({ innerTx: true }));
    expect(postTransaction).not.toHaveBeenCalled();
    expect(openCallbackOrGoHome)
      .toHaveBeenCalledExactlyOnceWith(true, { transaction: 'sg_tx_original' });
  });
});
