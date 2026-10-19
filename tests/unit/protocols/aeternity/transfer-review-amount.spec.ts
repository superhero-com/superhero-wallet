/**
 * [BLACK-BOX] The aeternity review screen signs exactly the amount the user
 * confirmed. The component, the adapter, `useAeSdk`, the SDK's spend and contract
 * calls and the wallet's signer are real; the node is stubbed at its API methods and
 * the signed transaction is read back from `postTransaction`. The account store and
 * the composables a transfer does not go through are stubbed too.
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
import TransferQRCodeGenerator from '@/popup/components/TransferQRCodeGenerator.vue';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { i18n } from '@/popup/plugins/i18n';
import Logger from '@/lib/logger';

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
const TOKEN = 'ct_46WPtSJH9Mc1rNbRaWo6k2v6Bm8dc1FuCFxS2n6gFo7M27Ucu';
const AE_ASSET = { contractId: AE_CONTRACT_ID, protocol: PROTOCOLS.aeternity, decimals: 18 };
const RECIPIENTS = [RECIPIENT, MemoryAccount.generate().address, MemoryAccount.generate().address];

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<object>(),
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  const isActiveAccountAirGap = ref(false);
  return {
    useAccounts: () => ({
      activeAccount: ref(ACCOUNT),
      isActiveAccountAirGap,
      aeAccounts: ref([ACCOUNT]),
      accountsAddressList: ref([ACCOUNT.address]),
      getLastActiveProtocolAccount: () => ACCOUNT,
      getAccountByProtocolAndAddress: () => ACCOUNT,
      onAccountChange: () => {},
    }),
  };
});

const { generateTransactionURDataFragments } = vi.hoisted(() => ({
  generateTransactionURDataFragments: vi.fn(async () => ['ur:fragment']),
}));

// The AirGap QR code is built from the unsigned transaction it is given.
vi.mock('@/composables/airGap', () => ({
  useAirGap: () => ({ generateTransactionURDataFragments }),
}));

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

async function acceptTransaction({ tx }: { tx: string }) {
  postedTxs.push(tx as Encoded.Transaction);
  return { txHash: buildTxHash(tx as Encoded.Transaction) };
}

let postTransaction: ReturnType<typeof vi.spyOn<Node, 'postTransaction'>>;
let chainNonce = 0;
let nextNonce = 1;

beforeAll(() => {
  vi.spyOn(Node.prototype, 'getStatus').mockResolvedValue({
    networkId: 'ae_uat',
    nodeVersion: '7.3.0',
    protocols: [{ version: 6, effectiveAtHeight: 0 }],
    topBlockHeight: 100,
  } as any);
  vi.spyOn(Node.prototype, 'getCurrentKeyBlockHeight').mockResolvedValue({ height: 100 });
  // No protocol parameters endpoint, so the SDK's own are used.
  const notFound = Object.assign(new Error('Not found'), { statusCode: 404 });
  vi.spyOn(Node.prototype, 'getProtocolParameters').mockRejectedValue(notFound);
  vi.spyOn(Node.prototype, 'getNodeSettings').mockRejectedValue(notFound);
  vi.spyOn(Node.prototype, 'getRecentGasPrices')
    .mockResolvedValue([{ minGasPrice: 1000000000n, minutes: 1, utilization: 0 }]);
  // Contract calls: the contract exists and the dry run that prices the gas succeeds,
  // but only at the nonce that follows the chain's, as on a real node.
  vi.spyOn(Node.prototype, 'getContract').mockImplementation(async (contractId) => ({
    id: contractId,
    ownerId: ACCOUNT.address,
    vmVersion: 7,
    abiVersion: 3,
    active: true,
    referrerIds: [],
    deposit: 0n,
  } as any));
  vi.spyOn(Node.prototype, 'protectedDryRunTxs').mockImplementation(async ({ txs }) => ({
    results: txs.map(({ tx }) => (
      unpackTx(tx as Encoded.Transaction, Tag.ContractCallTx).nonce === chainNonce + 1
        ? {
          type: 'contract_call',
          result: 'ok',
          callObj: {
            callerId: ACCOUNT.address,
            callerNonce: chainNonce + 1,
            contractId: TOKEN,
            gasPrice: 1000000000n,
            gasUsed: 20000,
            height: 100,
            log: [],
            returnType: 'ok',
            // unit
            returnValue: 'cb_Xfbg4g==',
          },
        }
        : { type: 'contract_call', result: 'error', reason: 'tx_nonce_too_high_for_account' }
    )),
  } as any));
  vi.spyOn(Node.prototype, 'getAccountByPubkey').mockImplementation(async (address) => ({
    id: address,
    balance: 10n ** 30n,
    nonce: chainNonce,
    kind: 'basic',
    payable: true,
  } as any));
  // Counts the mempool too, unlike the account's nonce.
  vi.spyOn(Node.prototype, 'getAccountNextNonce').mockImplementation(async () => ({ nextNonce }));
  postTransaction = vi.spyOn(Node.prototype, 'postTransaction')
    .mockImplementation(acceptTransaction as any);
  vi.spyOn(Logger, 'write').mockResolvedValue(undefined);
});

afterAll(() => vi.restoreAllMocks());

beforeEach(() => {
  chainNonce = 0;
  nextNonce = 1;
  postedTxs.length = 0;
  vi.clearAllMocks();
  // Also drops a failure a test queued but did not reach.
  postTransaction.mockReset().mockImplementation(acceptTransaction as any);
});

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

function mountReview(transferData: Record<string, any>, props: Record<string, any> = {}) {
  return mount(TransferReview, {
    props: {
      transferData: {
        selectedAsset: AE_ASSET,
        payload: '',
        invoiceId: null,
        ...transferData,
      },
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: { TransferReviewBase: true },
    },
  });
}

/** Confirms an AE transfer on the review screen and returns the amount it signed, in aettos. */
async function signReviewedTransfer(amount: string) {
  postedTxs.length = 0;
  const wrapper = mountReview({
    amount,
    addresses: [RECIPIENT],
    fee: new BigNumber('0.00002'),
    nonce: 1,
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

function postedSpendTxs() {
  return postedTxs.map((tx) => unpackTx(tx, Tag.SignedTx).encodedTx as {
    nonce: number;
    fee: string;
    recipientId: string;
  });
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
    const amount = '1234.567890123456789012';
    const wrapper = mountReview({
      amount,
      addresses: ['https://example.com'],
      selectedAsset: { contractId: TOKEN, protocol: PROTOCOLS.aeternity, decimals: 18 },
      note: 'Thanks',
    }, { isAddressUrl: true });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(createOrChangeAllowance).toHaveBeenCalledWith(TOKEN, amount);
    expect(tipToken).toHaveBeenCalledWith(
      'https://example.com',
      'Thanks',
      TOKEN,
      toBaseUnits(amount, 18),
    );
  });
});

describe('aeternity TransferReview - nonce', () => {
  it('signs with the next nonce counting pending transactions', async () => {
    chainNonce = 4;
    nextNonce = 9;
    const wrapper = mountReview({
      amount: '1',
      addresses: [RECIPIENT],
      fee: new BigNumber('0.00002'),
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(postedSpendTxs().map(({ nonce }) => nonce)).toEqual([9]);
  });

  it('sends a token with the next nonce while a transaction is pending', async () => {
    chainNonce = 4;
    nextNonce = 6;
    const wrapper = mountReview({
      amount: '1',
      addresses: [RECIPIENT],
      selectedAsset: { contractId: TOKEN, protocol: PROTOCOLS.aeternity, decimals: 18 },
      fee: new BigNumber('0.0002'),
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(Logger.write).not.toHaveBeenCalled();
    expect(postedTxs).toHaveLength(1);
    expect(unpackTx(postedTxs[0], Tag.SignedTx).encodedTx)
      .toMatchObject({ tag: Tag.ContractCallTx, contractId: TOKEN, nonce: 6 });
  });
});

describe('aeternity TransferReview - several recipients', () => {
  async function sendToThree() {
    const wrapper = mountReview({
      amount: '1',
      addresses: RECIPIENTS,
      fee: new BigNumber('0.00006'),
      nonce: 1,
    });
    await flushPromises();
    await (wrapper.vm as any).submit();
  }

  it('stops at a failed first transaction instead of leaving later nonces pending', async () => {
    postTransaction.mockRejectedValueOnce(new Error('Node is down'));
    await sendToThree();

    expect(postTransaction).toHaveBeenCalledTimes(1);
    expect(postedTxs).toHaveLength(0);
    expect(Logger.write).toHaveBeenCalledTimes(1);
    expect(Logger.write)
      .toHaveBeenCalledWith(expect.objectContaining({ message: 'Node is down' }));
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('splits a custom fee into whole aettos', async () => {
    const wrapper = mountReview({
      amount: '1',
      addresses: RECIPIENTS,
      fee: new BigNumber('0.0001'),
      nonce: 1,
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(Logger.write).not.toHaveBeenCalled();
    expect(postedSpendTxs().map(({ fee }) => fee))
      .toEqual(['33333333333333', '33333333333333', '33333333333333']);
  });

  it('stops at a failed second transaction and opens the one sent', async () => {
    postTransaction
      .mockImplementationOnce(acceptTransaction as any)
      .mockRejectedValueOnce(new Error('Node is down'));
    await sendToThree();

    expect(postTransaction).toHaveBeenCalledTimes(2);
    expect(postedSpendTxs().map(({ nonce }) => nonce)).toEqual([1]);
    expect(Logger.write).toHaveBeenCalledTimes(1);
    expect(Logger.write)
      .toHaveBeenCalledWith(expect.objectContaining({ message: 'Node is down' }));
    expect(routerPush).toHaveBeenCalledWith(expect.objectContaining({
      query: { latestTxHash: buildTxHash(postedTxs[0]) },
    }));
  });

  it('transfers a token to every recipient with the following nonces', async () => {
    chainNonce = 4;
    nextNonce = 5;
    const wrapper = mountReview({
      amount: '1',
      addresses: RECIPIENTS,
      selectedAsset: { contractId: TOKEN, protocol: PROTOCOLS.aeternity, decimals: 18 },
      // 0.0002 AE each, above the least fee of a contract call
      fee: new BigNumber('0.0006'),
    });
    await flushPromises();
    await (wrapper.vm as any).submit();

    expect(Logger.write).not.toHaveBeenCalled();
    expect(postedTxs.map((tx) => unpackTx(tx, Tag.SignedTx).encodedTx)).toMatchObject([
      { tag: Tag.ContractCallTx, contractId: TOKEN, nonce: 5 },
      { tag: Tag.ContractCallTx, contractId: TOKEN, nonce: 6 },
      { tag: Tag.ContractCallTx, contractId: TOKEN, nonce: 7 },
    ]);
  });
});

describe('aeternity TransferQRCodeGenerator', () => {
  it('builds the AirGap transaction with a fee in whole aettos', async () => {
    const { useAccounts } = await import('@/composables/accounts');
    const { isActiveAccountAirGap } = useAccounts();
    isActiveAccountAirGap.value = true;
    try {
      mount(TransferQRCodeGenerator, {
        props: {
          transferData: {
            amount: '1',
            addresses: [RECIPIENT],
            selectedAsset: AE_ASSET,
            // 0.00002 AE and half an aetto, which must be dropped
            fee: new BigNumber('0.0000200000000000005'),
            nonce: 1,
            payload: '',
          },
        },
        global: { stubs: { WrappedQrCode: true } },
      });
      await vi.waitFor(() => expect(generateTransactionURDataFragments).toHaveBeenCalled());
    } finally {
      isActiveAccountAirGap.value = false;
    }

    const [, tx] = generateTransactionURDataFragments.mock.calls[0] as unknown as [
      unknown, Encoded.Transaction,
    ];
    expect(unpackTx(tx, Tag.SpendTx)).toMatchObject({
      recipientId: RECIPIENT,
      amount: '1000000000000000000',
      fee: '20000000000000',
    });
  });
});
