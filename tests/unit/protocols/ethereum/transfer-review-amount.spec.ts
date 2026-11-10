/**
 * [BLACK-BOX] The EVM review screen signs exactly the amount the user confirmed, on
 * every chain it serves. The component, the adapters and the signing are real; only
 * the account store, the RPC client (nonce, gas price, token contract calls), the block
 * explorer and the broadcast are stubbed.
 */
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { Transaction, TransactionFactory, privateKeyToAddress } from 'web3-eth-accounts';
import { decodeFunctionCall } from 'web3-eth-abi';
import { bytesToHex, hexToBytes } from 'web3-utils';

import '@/protocols/registerAdapters';
import TransferReview from '@/protocols/ethereum/components/TransferReview.vue';
import { PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables';
import Logger from '@/lib/logger';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n, tg } from '@/popup/plugins/i18n';
import { useEthTokenBalance } from '@/protocols/ethereum/composables/ethTokenBalance';

type Broadcast = (web3Eth: unknown, serializedTx: Uint8Array | string) => Promise<void>;

// The setup files already loaded the adapters with the real deps; reload them to apply mocks.
const {
  SECRET_KEY,
  broadcastSignedTransaction,
  explorerRequests,
  tokenBalance,
  nonceCount,
} = vi.hoisted(() => {
  vi.resetModules();
  return {
    // A 32-byte value below the secp256k1 curve order is a valid private key.
    SECRET_KEY: Buffer.alloc(32, 1),
    broadcastSignedTransaction: vi.fn<Broadcast>(async () => {}),
    explorerRequests: [] as unknown[],
    // In the token's base units, `null` for a failing read
    tokenBalance: { value: 1000000000000n as bigint | null },
    // Of the account's mined transactions, and with the ones in the node's mempool.
    // Sends of earlier tests stay recorded, and only count while these two differ.
    nonceCount: { mined: 3n, pending: 3n },
  };
});

/** The standard ERC-20 transfer, to read the signed calldata back with. */
const TRANSFER_ABI = {
  name: 'transfer',
  type: 'function',
  inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable',
} as const;
const FROM_ACCOUNT = privateKeyToAddress(SECRET_KEY);
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const OTHER_RECIPIENT = '0x0000000000000000000000000000000000000005';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';
const CHAIN_IDS: Record<string, bigint> = {
  [PROTOCOLS.ethereum]: 1n,
  [PROTOCOLS.bnb]: 56n,
  [PROTOCOLS.avalanche]: 43114n,
  [PROTOCOLS.polygonPos]: 137n,
};

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
      getBlockNumber: async () => 100n,
      getTransactionCount: async (address: string, block: bigint | 'pending') => (
        block === 'pending' ? nonceCount.pending : nonceCount.mined
      ),
      getGasPrice: async () => 1000000000n,
    };
  };
  return {
    ...await importOriginal<object>(),
    Web3Eth,
    default: Web3Eth,
    getTransactionCount: async () => Number(nonceCount.pending),
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
        balanceOf: () => ({
          call: async () => tokenBalance.value ?? Promise.reject(new Error('Node error')),
        }),
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

afterEach(() => {
  tokenBalance.value = 1000000000000n;
  nonceCount.mined = 3n;
  nonceCount.pending = 3n;
});

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

/** Confirms a token send on the review screen and returns how many transactions it broadcast */
async function submitTokenSend(
  protocol: string,
  amount: string,
  recipients = [RECIPIENT],
  contractId = TOKEN_CONTRACT,
) {
  broadcastSignedTransaction.mockClear();
  const wrapper = mount(TransferReview, {
    props: {
      protocol,
      transferData: {
        amount,
        addresses: recipients,
        selectedAsset: { contractId, protocol, decimals: 6 },
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
  return broadcastSignedTransaction.mock.calls.length;
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

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s TransferReview - coin transfer', (protocol) => {
  it('signs a plain transfer to the recipient on the chain', async () => {
    // The coin isn't checked against a token balance
    tokenBalance.value = 0n;
    const { coinContractId } = ProtocolAdapterFactory.getAdapter(protocol as any);
    const signedTx = await signReviewed(protocol, coinContractId, '0.5');

    expect(signedTx.to?.toString()).toBe(RECIPIENT);
    expect(signedTx.value).toBe(500000000000000000n);
    expect(signedTx.data).toHaveLength(0);
    expect(signedTx.common.chainId()).toBe(CHAIN_IDS[protocol]);
    expect(signedTx.nonce).toBe(3n);
    expect(signedTx.gasLimit).toBe(21000n);
  });
});

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s TransferReview - token transfer', (protocol) => {
  beforeEach(() => {
    explorerRequests.length = 0;
  });

  it('calls the token contract to transfer the amount in its own decimals', async () => {
    const signedTx = await signReviewed(protocol, TOKEN_CONTRACT, '1.5');

    expect(signedTx.to?.toString()).toBe(TOKEN_CONTRACT);
    expect(signedTx.value).toBe(0n);
    expect(signedTx.common.chainId()).toBe(CHAIN_IDS[protocol]);
    expect(signedTx.nonce).toBe(3n);
    // The node's estimate of 65 000 gas plus 15% headroom
    expect(signedTx.gasLimit).toBe(74750n);
    const callData = bytesToHex(signedTx.data);
    // The selector of transfer(address,uint256)
    expect(callData.slice(0, 10)).toBe('0xa9059cbb');
    expect(decodeFunctionCall(TRANSFER_ABI, callData)).toMatchObject({
      __method__: 'transfer(address,uint256)',
      to: RECIPIENT,
      value: 1500000n,
    });
  });

  it('signs without waiting for the block explorer', async () => {
    await signReviewed(protocol, TOKEN_CONTRACT, '1.5');

    expect(explorerRequests).toEqual([]);
  });
});

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s TransferReview - unmined token sends', (protocol) => {
  beforeEach(() => {
    vi.spyOn(Logger, 'write').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.mocked(Logger.write).mockRestore();
  });

  it('leaves the send to each recipient out until it is mined', async () => {
    // A token of its own, which no other test sends
    const contractId = '0x0000000000000000000000000000000000000010';
    const { nodeUrl } = useNetworks().activeNetwork.value.protocols[protocol];
    const getSpendable = async () => (
      await useEthTokenBalance().getSpendableTokenBalance(contractId, FROM_ACCOUNT, nodeUrl)
    ).toFixed();
    tokenBalance.value = 3000000n;

    expect(await submitTokenSend(protocol, '1', [RECIPIENT, OTHER_RECIPIENT], contractId)).toBe(2);
    // Both are in the node's mempool
    nonceCount.pending = 5n;
    expect(await getSpendable()).toBe('1');
    // The first one is mined
    nonceCount.mined = 4n;
    tokenBalance.value = 2000000n;
    expect(await getSpendable()).toBe('1');
  });

  it('does not send what an unmined send already spends', async () => {
    const contractId = '0x0000000000000000000000000000000000000011';
    tokenBalance.value = 3000000n;
    expect(await submitTokenSend(protocol, '2', [RECIPIENT], contractId)).toBe(1);
    // It is in the node's mempool
    nonceCount.pending = 4n;

    expect(await submitTokenSend(protocol, '1.5', [RECIPIENT], contractId)).toBe(0);
    expect(Logger.write).toHaveBeenCalledWith(expect.objectContaining({
      message: tg('modals.insufficient-balance.msg'),
    }));
    // It is mined
    nonceCount.mined = 4n;
    tokenBalance.value = 1000000n;
    expect(await submitTokenSend(protocol, '1', [RECIPIENT], contractId)).toBe(1);
  });

  it('leaves out a send made before one that failed', async () => {
    const contractId = '0x0000000000000000000000000000000000000012';
    const { nodeUrl } = useNetworks().activeNetwork.value.protocols[protocol];
    tokenBalance.value = 3000000n;
    broadcastSignedTransaction
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Rejected'));

    expect(await submitTokenSend(protocol, '1', [RECIPIENT, OTHER_RECIPIENT], contractId)).toBe(2);
    expect(Logger.write).toHaveBeenCalledWith(expect.objectContaining({ message: 'Rejected' }));
    // Only the first one is in the node's mempool
    nonceCount.pending = 4n;
    expect((
      await useEthTokenBalance().getSpendableTokenBalance(contractId, FROM_ACCOUNT, nodeUrl)
    ).toFixed()).toBe('2');
  });
});

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s TransferReview - token balance', (protocol) => {
  beforeEach(() => {
    vi.spyOn(Logger, 'write').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.mocked(Logger.write).mockRestore();
  });

  it('does not send more than the node balance and says why', async () => {
    tokenBalance.value = 1000000n;

    expect(await submitTokenSend(protocol, '1.000001')).toBe(0);
    expect(Logger.write).toHaveBeenCalledWith(expect.objectContaining({
      message: tg('modals.insufficient-balance.msg'),
    }));
  });

  it('sends the whole balance split across recipients', async () => {
    tokenBalance.value = 3000000n;

    expect(await submitTokenSend(protocol, '1.5', [RECIPIENT, OTHER_RECIPIENT])).toBe(2);
    expect(Logger.write).not.toHaveBeenCalled();
  });

  it('does not send more than the balance across recipients', async () => {
    tokenBalance.value = 3000000n;

    expect(await submitTokenSend(protocol, '1.6', [RECIPIENT, OTHER_RECIPIENT])).toBe(0);
  });

  it('sends if the node balance cannot be read', async () => {
    tokenBalance.value = null;

    expect(await submitTokenSend(protocol, '1.5')).toBe(1);
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
