/**
 * [BLACK-BOX] The EVM review screen signs exactly the amount the user confirmed, on
 * every chain it serves. The component, the adapters and the signing are real; only
 * the account store, the RPC client (nonce, gas price, token contract calls), the block
 * explorer and the broadcast are stubbed.
 */
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { Transaction, TransactionFactory, privateKeyToAddress } from 'web3-eth-accounts';
import { hexToBytes } from 'web3-utils';

import '@/protocols/registerAdapters';
import TransferReview from '@/protocols/ethereum/components/TransferReview.vue';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';

type Broadcast = (web3Eth: unknown, serializedTx: Uint8Array | string) => Promise<void>;

// The setup files already loaded the adapters with the real deps; reload them to apply mocks.
const {
  SECRET_KEY,
  broadcastSignedTransaction,
  explorerRequests,
} = vi.hoisted(() => {
  vi.resetModules();
  return {
    // A 32-byte value below the secp256k1 curve order is a valid private key.
    SECRET_KEY: Buffer.alloc(32, 1),
    broadcastSignedTransaction: vi.fn<Broadcast>(async () => {}),
    explorerRequests: [] as unknown[],
  };
});

const FROM_ACCOUNT = privateKeyToAddress(SECRET_KEY);
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<object>(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({
    getLastActiveProtocolAccount: (protocol: string) => ({ protocol, address: FROM_ACCOUNT }),
    getAccountByProtocolAndAddress: (protocol: string) => ({
      protocol,
      address: FROM_ACCOUNT,
      secretKey: SECRET_KEY,
    }),
  }),
}));

vi.mock('@/composables/latestTransactionList', () => ({
  useLatestTransactionList: () => ({ addAccountPendingTransaction: vi.fn() }),
}));

// RPC client: the nonce (in both ways the adapters ask for it) and the gas price.
vi.mock('web3-eth', async (importOriginal) => {
  // vitest constructs this directly (`new Web3Eth(...)`), which throws on an arrow fn.
  // eslint-disable-next-line prefer-arrow-callback
  const Web3Eth = function Web3Eth() {
    return {
      getTransactionCount: async () => 3n,
      getGasPrice: async () => 1000000000n,
    };
  };
  return {
    ...await importOriginal<object>(),
    Web3Eth,
    default: Web3Eth,
    getTransactionCount: async () => 3,
  };
});

// A 6-decimal ERC-20 token; the calldata is the real encoding with the ABI the adapter passes.
vi.mock('web3-eth-contract', async (importOriginal) => {
  const { encodeFunctionCall } = await import('web3-eth-abi');
  // eslint-disable-next-line prefer-arrow-callback
  const Contract = function Contract(abi: { name?: string }[]) {
    const transferAbi = abi.find(({ name }) => name === 'transfer');
    return {
      setProvider: () => {},
      methods: {
        decimals: () => ({ call: async () => 6n }),
        transfer: (to: string, value: string) => ({
          estimateGas: async () => 65000n,
          encodeABI: () => encodeFunctionCall(transferAbi as any, [to, value]),
        }),
      },
    };
  };
  return { ...await importOriginal<object>(), Contract, default: Contract };
});

vi.mock('@/protocols/ethereum/libs/EtherscanService', () => ({
  // eslint-disable-next-line prefer-arrow-callback
  EtherscanService: function EtherscanService() {
    return {
      fetchFromApi: async (params: unknown) => {
        explorerRequests.push(params);
        return { status: '1', result: '[]' };
      },
    };
  },
}));

vi.mock('@/protocols/evm/libs/broadcastSignedTransaction', () => ({ broadcastSignedTransaction }));

enableAutoUnmount(afterEach);

/** Base units of a plain decimal string, worked out without floating point. */
function toBaseUnits(amount: string, decimals: number) {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole + fraction.padEnd(decimals, '0'));
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

/** Confirms a transfer on the review screen and returns the transaction it signed. */
async function signReviewed(protocol: string, contractId: string, amount: string) {
  broadcastSignedTransaction.mockClear();
  const wrapper = mount(TransferReview, {
    props: {
      protocol,
      transferData: {
        amount,
        addresses: [RECIPIENT],
        selectedAsset: {
          contractId,
          protocol,
          decimals: contractId === TOKEN_CONTRACT ? 6 : 18,
        },
        maxFeePerGas: '0.00000002',
        maxPriorityFeePerGas: '0.000000001',
        payload: '',
      },
    },
    global: {
      plugins: [i18n],
      stubs: { TransferReviewBase: true },
    },
  });
  await (wrapper.vm as any).submit();

  expect(broadcastSignedTransaction).toHaveBeenCalledTimes(1);
  const [, serializedTx] = broadcastSignedTransaction.mock.calls[0];
  // BNB and Polygon broadcast the raw transaction as a hex string.
  const signedTx = TransactionFactory.fromSerializedData(
    typeof serializedTx === 'string' ? hexToBytes(serializedTx) : serializedTx,
  );
  expect(signedTx.getSenderAddress().toString()).toBe(FROM_ACCOUNT.toLowerCase());
  return signedTx;
}

/** Confirms a coin transfer on the review screen and returns the value it signed. */
async function signReviewedTransfer(protocol: string, amount: string) {
  const { coinContractId } = ProtocolAdapterFactory.getAdapter(protocol as any);
  return (await signReviewed(protocol, coinContractId, amount)).value;
}

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s TransferReview - signed amount', (protocol) => {
  it('signs every digit of an 18-decimal amount', async () => {
    expect(await signReviewedTransfer(protocol, '1.123456789012345678'))
      .toBe(1123456789012345678n);
  });

  it('signs a large max-balance-like amount exactly', async () => {
    expect(await signReviewedTransfer(protocol, '98765.432109876543210987'))
      .toBe(98765432109876543210987n);
  });

  it('signs 0.1 without float drift', async () => {
    expect(await signReviewedTransfer(protocol, '0.1')).toBe(100000000000000000n);
  });

  it('signs random 18-decimal amounts exactly', async () => {
    const random = createRandom(20261016);
    // eslint-disable-next-line no-restricted-syntax
    for (const amount of Array.from({ length: 10 }, () => randomAmount(random, 18))) {
      // eslint-disable-next-line no-await-in-loop
      expect(await signReviewedTransfer(protocol, amount), amount)
        .toBe(toBaseUnits(amount, 18));
    }
  });
});

// Avalanche has no token transfers.
describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.polygonPos,
])('%s TransferReview - token transfer', (protocol) => {
  beforeEach(() => {
    explorerRequests.length = 0;
  });

  it('signs without waiting for the block explorer', async () => {
    await signReviewed(protocol, TOKEN_CONTRACT, '1.5');

    expect(explorerRequests).toEqual([]);
  });
});

describe('TransferReview - chains without EIP-1559', () => {
  it.each([
    [PROTOCOLS.bnb, 'coin'],
    [PROTOCOLS.bnb, 'token'],
    [PROTOCOLS.avalanche, 'coin'],
    [PROTOCOLS.polygonPos, 'coin'],
    [PROTOCOLS.polygonPos, 'token'],
  ])('signs the gas price picked on the form (%s %s)', async (protocol, asset) => {
    const contractId = asset === 'token'
      ? TOKEN_CONTRACT
      : ProtocolAdapterFactory.getAdapter(protocol).coinContractId;
    const signedTx = await signReviewed(protocol, contractId, '1') as Transaction;

    // The form's 20 gwei rather than the node's 1 gwei.
    expect(signedTx.gasPrice).toBe(20000000000n);
  });
});
