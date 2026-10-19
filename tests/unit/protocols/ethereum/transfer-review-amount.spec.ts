/**
 * [BLACK-BOX] The EVM review screen signs exactly the amount the user confirmed, on
 * every chain it serves. The component, the adapters and the signing are real; only
 * the account store, the RPC client (nonce, gas price) and the broadcast are stubbed.
 */
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { TransactionFactory, privateKeyToAddress } from 'web3-eth-accounts';

import '@/protocols/registerAdapters';
import TransferReview from '@/protocols/ethereum/components/TransferReview.vue';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';

type Broadcast = (web3Eth: unknown, serializedTx: Uint8Array) => Promise<void>;

// The setup files already loaded the adapters with the real deps; reload them to apply mocks.
const { SECRET_KEY, broadcastSignedTransaction } = vi.hoisted(() => {
  vi.resetModules();
  return {
    // A 32-byte value below the secp256k1 curve order is a valid private key.
    SECRET_KEY: Buffer.alloc(32, 1),
    broadcastSignedTransaction: vi.fn<Broadcast>(async () => {}),
  };
});

const FROM_ACCOUNT = privateKeyToAddress(SECRET_KEY);
const RECIPIENT = '0x0000000000000000000000000000000000000002';

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

/** Confirms a coin transfer on the review screen and returns the value it signed. */
async function signReviewedTransfer(protocol: string, amount: string) {
  broadcastSignedTransaction.mockClear();
  const { coinContractId } = ProtocolAdapterFactory.getAdapter(protocol as any);
  const wrapper = mount(TransferReview, {
    props: {
      protocol,
      transferData: {
        amount,
        addresses: [RECIPIENT],
        selectedAsset: { contractId: coinContractId, protocol, decimals: 18 },
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
  const signedTx = TransactionFactory.fromSerializedData(serializedTx);
  expect(signedTx.getSenderAddress().toString()).toBe(FROM_ACCOUNT.toLowerCase());
  return signedTx.value;
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
