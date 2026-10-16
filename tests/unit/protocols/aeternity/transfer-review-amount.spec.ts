/**
 * [BLACK-BOX] The aeternity review screen signs exactly the amount the user
 * confirmed. The component, the adapter, `useAeSdk`, the SDK's spend and the
 * wallet's signer are real; the node is stubbed at its API methods and the signed
 * transaction is read back from `postTransaction`. The account store and the
 * composables a coin transfer does not go through are stubbed too.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import BigNumber from 'bignumber.js';
import {
  Encoded,
  MemoryAccount,
  Node,
  Tag,
  buildTxHash,
  decode,
  unpackTx,
} from '@aeternity/aepp-sdk';

import '@/protocols/registerAdapters';
import TransferReview from '@/protocols/aeternity/components/TransferReview.vue';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { i18n } from '@/popup/plugins/i18n';

// The setup files already loaded the composables with the real deps; reload them to apply mocks.
vi.hoisted(() => vi.resetModules());

const signer = MemoryAccount.generate();
const ACCOUNT = {
  protocol: PROTOCOLS.aeternity,
  type: 'hd-wallet',
  idx: 0,
  globalIdx: 0,
  address: signer.address,
  secretKey: decode(signer.secretKey),
};
const RECIPIENT = MemoryAccount.generate().address;

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<object>(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  return {
    useAccounts: () => ({
      activeAccount: ref(ACCOUNT),
      isActiveAccountAirGap: ref(false),
      aeAccounts: ref([ACCOUNT]),
      accountsAddressList: ref([ACCOUNT.address]),
      getLastActiveProtocolAccount: () => ACCOUNT,
      getAccountByProtocolAndAddress: () => ACCOUNT,
      onAccountChange: () => {},
    }),
  };
});

// Needs the Ionic router; a send from the transfer form is not a deep link.
vi.mock('@/composables/deepLinkApi', () => ({
  useDeepLinkApi: () => ({ isDeepLinkUsed: false, openCallbackOrGoHome: vi.fn() }),
}));

const { createOrChangeAllowance, tipToken } = vi.hoisted(() => ({
  createOrChangeAllowance: vi.fn(),
  tipToken: vi.fn(async () => ({ hash: 'th_tip' })),
}));

// Token allowances (tips) only; it would start token balance and price polling.
vi.mock('@/composables/fungibleTokens', () => ({
  useFungibleTokens: () => ({ createOrChangeAllowance }),
}));

// Token tips exist on testnet only, so the tipping contract is faked where the call is signed.
vi.mock('@/composables/tippingContracts', () => ({
  useTippingContracts: () => ({
    getTippingContracts: async () => ({
      tippingV2: { tip_token: tipToken, $options: { address: 'ct_tipping' } },
    }),
  }),
}));

vi.mock('@/composables/latestTransactionList', async () => {
  const { ref } = await import('vue');
  return {
    useLatestTransactionList: () => ({
      addAccountPendingTransaction: vi.fn(),
      allLatestTransactions: ref([]),
    }),
  };
});

enableAutoUnmount(afterEach);

const postedTxs: Encoded.Transaction[] = [];

beforeAll(() => {
  vi.spyOn(Node.prototype, 'getStatus').mockResolvedValue({
    networkId: 'ae_uat',
    nodeVersion: '7.3.0',
    protocols: [{ version: 6, effectiveAtHeight: 0 }],
    topBlockHeight: 100,
  } as any);
  vi.spyOn(Node.prototype, 'getCurrentKeyBlockHeight').mockResolvedValue({ height: 100 });
  vi.spyOn(Node.prototype, 'getAccountByPubkey').mockImplementation(async (address) => ({
    id: address,
    balance: 10n ** 30n,
    nonce: 0,
    kind: 'basic',
    payable: true,
  } as any));
  vi.spyOn(Node.prototype, 'postTransaction').mockImplementation(async ({ tx }) => {
    postedTxs.push(tx as Encoded.Transaction);
    return { txHash: buildTxHash(tx as Encoded.Transaction) };
  });
});

afterAll(() => vi.restoreAllMocks());

/** Base units of a plain decimal string, worked out without floating point. */
function toBaseUnits(amount: string, decimals: number) {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole + fraction.padEnd(decimals, '0')).toString();
}

/** Seeded (Park-Miller) so that a failing amount always reproduces. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function randomAmount(random: () => number, decimals: number) {
  const fraction = Array.from({ length: decimals }, () => Math.floor(random() * 10)).join('');
  return `${Math.floor(random() * 100000)}.${fraction}`;
}

/** Confirms an AE transfer on the review screen and returns the amount it signed, in aettos. */
async function signReviewedTransfer(amount: string) {
  postedTxs.length = 0;
  const wrapper = mount(TransferReview, {
    props: {
      transferData: {
        amount,
        addresses: [RECIPIENT],
        selectedAsset: { contractId: AE_CONTRACT_ID, protocol: PROTOCOLS.aeternity, decimals: 18 },
        fee: new BigNumber('0.00002'),
        nonce: 1,
        payload: '',
        invoiceId: null,
      },
    },
    global: {
      plugins: [i18n],
      stubs: { TransferReviewBase: true },
    },
  });
  await flushPromises();
  await (wrapper.vm as any).submit();

  expect(postedTxs).toHaveLength(1);
  const { encodedTx } = unpackTx(postedTxs[0], Tag.SignedTx);
  expect(encodedTx).toMatchObject({
    tag: Tag.SpendTx,
    senderId: ACCOUNT.address,
    recipientId: RECIPIENT,
  });
  return (encodedTx as { amount: string }).amount;
}

describe('aeternity TransferReview - signed amount', () => {
  it('signs every digit of an 18-decimal amount', async () => {
    expect(await signReviewedTransfer('1.499825123456789123')).toBe('1499825123456789123');
  });

  it('signs a large max-balance-like amount exactly', async () => {
    expect(await signReviewedTransfer('98765.432109876543210987'))
      .toBe('98765432109876543210987');
  });

  it('signs 0.1 without float drift', async () => {
    expect(await signReviewedTransfer('0.1')).toBe('100000000000000000');
  });

  it('signs random 18-decimal amounts exactly', async () => {
    const random = createRandom(20261016);
    // eslint-disable-next-line no-restricted-syntax
    for (const amount of Array.from({ length: 10 }, () => randomAmount(random, 18))) {
      // eslint-disable-next-line no-await-in-loop
      expect(await signReviewedTransfer(amount), amount).toBe(toBaseUnits(amount, 18));
    }
  });

  it('allows and tips every digit of a token amount', async () => {
    const token = 'ct_46WPtSJH9Mc1rNbRaWo6k2v6Bm8dc1FuCFxS2n6gFo7M27Ucu';
    const amount = '1234.567890123456789012';
    const wrapper = mount(TransferReview, {
      props: {
        transferData: {
          amount,
          addresses: ['https://example.com'],
          selectedAsset: { contractId: token, protocol: PROTOCOLS.aeternity, decimals: 18 },
          note: 'Thanks',
          invoiceId: null,
        },
        isAddressUrl: true,
      },
      global: {
        plugins: [i18n],
        stubs: { TransferReviewBase: true },
      },
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(createOrChangeAllowance).toHaveBeenCalledWith(token, amount);
    expect(tipToken).toHaveBeenCalledWith(
      'https://example.com',
      'Thanks',
      token,
      toBaseUnits(amount, 18),
    );
  });
});
