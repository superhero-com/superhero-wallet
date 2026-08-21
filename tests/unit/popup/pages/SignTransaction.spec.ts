import { mount } from '@vue/test-utils';
import { Tag } from '@aeternity/aepp-sdk';

/**
 * The deep-link signing page. When an aepp asks the wallet to re-point a contract call
 * at the user's account, the transaction is signed AND broadcast from here, so its nonce
 * has to clear the mempool - the chain nonce collides with anything still pending.
 */

const CALLER = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';

const unpackTx = vi.fn(() => ({ tag: Tag.ContractCallTx, callerId: 'ak_dapp', nonce: 0 }));
const buildTx = vi.fn((tx: any) => `tx_rebuilt:${tx.callerId}:${tx.nonce}`);

vi.mock('@aeternity/aepp-sdk', async (importOriginal) => ({
  ...await importOriginal<typeof import('@aeternity/aepp-sdk')>(),
  unpackTx: (...args: any[]) => unpackTx(...(args as [])),
  buildTx: (...args: any[]) => buildTx(...(args as [any])),
}));

const getAccountNextNonce = vi.fn(async () => ({ nextNonce: 7 }));
const getAccountByPubkey = vi.fn(async () => ({ nonce: 2 }));
const signTransaction = vi.fn(async (tx: string) => `sg_${tx}`);
const openCallbackOrGoHome = vi.fn(async () => {});
const query: Record<string, string> = {};

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
      api: { getAccountNextNonce, getAccountByPubkey, postTransaction: vi.fn() },
      signTransaction,
      poll: vi.fn(),
    }),
  }),
}));

const SignTransaction = (await import('@/popup/pages/SignTransaction.vue')).default;

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
    buildTx.mockImplementation((tx: any) => `tx_rebuilt:${tx.callerId}:${tx.nonce}`);
    signTransaction.mockImplementation(async (tx: string) => `sg_${tx}`);
    getAccountNextNonce.mockResolvedValue({ nextNonce: 7 });
    Object.assign(query, {
      transaction: 'tx_original',
      networkId: 'ae_uat',
      'replace-caller': 'true',
    });
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

  it('leaves the transaction alone when the aepp did not ask to replace the caller', async () => {
    query['replace-caller'] = 'false';

    await mountAndSettle();

    expect(getAccountNextNonce).not.toHaveBeenCalled();
    expect(signTransaction).toHaveBeenCalledWith('tx_original', expect.anything());
  });
});
