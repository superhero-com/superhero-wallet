/**
 * [BLACK-BOX] EVM legacy ERC-20 transfer encoding: token-decimals scaling and gas
 * headroom for Polygon, BNB, and Avalanche.
 *
 * The adapters share one `loadAdapter()` - re-running the reset+doMock dance in one
 * file is unreliable (see tests/unit/protocols/ethereum/adapter-spend.spec.ts). RPC,
 * contract calls and broadcast are mocked; `web3-eth-accounts` signing stays real.
 */
import { TransactionFactory } from 'web3-eth-accounts';
import { hexToBytes } from 'web3-utils';
import { PROTOCOLS, NETWORK_TYPE_MAINNET } from '@/constants';

const SECRET_KEY = Buffer.alloc(32, 1);
const FROM_ACCOUNT = '0x0000000000000000000000000000000000000001';
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';

const contractMockState = {
  decimals: 18,
  estimateGas: 65000,
  transferCalls: [] as Array<{ recipient: string; amount: any }>,
};

/** Tx fields handed to the real signer, recorded per build. */
const builtTxData: any[] = [];
const broadcastSignedTransactionMock = vi.fn().mockResolvedValue(undefined);

async function loadAdapter() {
  vi.resetModules();

  vi.doMock('@/composables', () => ({
    useAccounts: () => ({
      getAccountByProtocolAndAddress: (protocol: string) => (
        [PROTOCOLS.polygonPos, PROTOCOLS.bnb, PROTOCOLS.avalanche].includes(protocol as any)
          ? { protocol, secretKey: SECRET_KEY }
          : undefined
      ),
    }),
  }));

  vi.doMock('@/protocols/avalanche/composables/avalancheNetworkSettings', () => ({
    useAvalancheNetworkSettings: () => ({
      avalancheActiveNetworkSettings: {
        value: {
          chainId: '43114',
          nodeUrl: 'http://localhost:9650/ext/bc/C/rpc',
        },
      },
      avalancheActiveNetworkPredefinedSettings: {
        value: { middlewareUrl: 'http://localhost/mdw' },
      },
    }),
  }));

  vi.doMock('@/composables/networks', () => ({
    useNetworks: () => ({
      activeNetworkName: { value: 'mainnet' },
      activeNetwork: {
        value: {
          type: NETWORK_TYPE_MAINNET,
          protocols: {
            [PROTOCOLS.polygonPos]: {
              chainId: '137',
              nodeUrl: 'http://localhost:8545',
              middlewareUrl: 'http://localhost/mdw',
            },
            [PROTOCOLS.bnb]: {
              chainId: '56',
              nodeUrl: 'http://localhost:8545',
              middlewareUrl: 'http://localhost/mdw',
            },
          },
        },
      },
    }),
  }));

  vi.doMock('web3-eth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('web3-eth')>();
    return {
      ...actual,
      // vitest constructs this directly (`new Web3Eth(...)`), which throws on an arrow fn.
      // eslint-disable-next-line prefer-arrow-callback
      default: vi.fn().mockImplementation(function Web3EthMock() {
        return {
          getGasPrice: () => Promise.resolve(BigInt(30000000000)),
          getTransactionCount: () => Promise.resolve(3),
        };
      }),
    };
  });

  vi.doMock('web3-eth-contract', () => ({
    // eslint-disable-next-line prefer-arrow-callback
    Contract: vi.fn().mockImplementation(function ContractMock() {
      return {
        setProvider: vi.fn(),
        methods: {
          decimals: () => ({ call: () => Promise.resolve(contractMockState.decimals) }),
          transfer: (recipient: string, amount: any) => {
            contractMockState.transferCalls.push({ recipient, amount });
            return {
              // web3 v4 resolves a bigint unless an explicit number format is passed.
              estimateGas: () => Promise.resolve(BigInt(contractMockState.estimateGas)),
              encodeABI: () => '0xabcdef',
            };
          },
        },
      };
    }),
  }));

  vi.doMock('@/protocols/ethereum/libs/EtherscanService', () => ({
    // eslint-disable-next-line prefer-arrow-callback
    EtherscanService: vi.fn().mockImplementation(function EtherscanServiceMock() {
      return { fetchFromApi: () => Promise.resolve({ result: null }) };
    }),
  }));

  vi.doMock('@/protocols/evm/libs/broadcastSignedTransaction', () => ({
    broadcastSignedTransaction: broadcastSignedTransactionMock,
  }));

  // The adapter signs with `new Transaction(...)`, so subclass rather than spy:
  // real signing behaviour is kept while the built fields are recorded.
  vi.doMock('web3-eth-accounts', async (importOriginal) => {
    const actual = await importOriginal<typeof import('web3-eth-accounts')>();
    class RecordingTransaction extends (actual.Transaction as any) {
      constructor(txData: any, opts: any) {
        builtTxData.push(txData);
        super(txData, opts);
      }
    }
    return { ...actual, Transaction: RecordingTransaction };
  });

  const { PolygonAdapter } = await import('@/protocols/polygonPos/libs/PolygonPosAdapter');
  const { BnbAdapter } = await import('@/protocols/bnb/libs/BnbAdapter');
  const { AvalancheAdapter } = await import('@/protocols/avalanche/libs/AvalancheAdapter');
  return { PolygonAdapter, BnbAdapter, AvalancheAdapter };
}

const adapters: Record<string, any> = {};

beforeAll(async () => {
  const { PolygonAdapter, BnbAdapter, AvalancheAdapter } = await loadAdapter();
  adapters.Polygon = new PolygonAdapter();
  adapters.BNB = new BnbAdapter();
  adapters.Avalanche = new AvalancheAdapter();
});

beforeEach(() => {
  contractMockState.decimals = 18;
  contractMockState.estimateGas = 65000;
  contractMockState.transferCalls.length = 0;
  builtTxData.length = 0;
  broadcastSignedTransactionMock.mockClear();
});

const transferToken = (
  name: string,
  amount: string,
  options: { nonce?: number } = {},
) => adapters[name].transferToken(amount, RECIPIENT, TOKEN_CONTRACT, {
  fromAccount: FROM_ACCOUNT,
  maxPriorityFeePerGas: '0.000000002',
  maxFeePerGas: '0.00000003',
  ...options,
});

const lastTransferAmount = () => BigInt(
  contractMockState.transferCalls.at(-1)!.amount as string,
);

describe.each(['Polygon', 'BNB', 'Avalanche'])('%s adapter transferToken', (name) => {
  it('scales the amount by a 6-decimal token\'s own decimals', async () => {
    contractMockState.decimals = 6;

    await transferToken(name, '1');

    expect(lastTransferAmount()).toBe(BigInt(1000000));
  });

  it('scales the amount by an 18-decimal token\'s decimals', async () => {
    contractMockState.decimals = 18;

    await transferToken(name, '1');

    expect(lastTransferAmount()).toBe(BigInt('1000000000000000000'));
  });

  it('truncates sub-base-unit precision rather than rounding up', async () => {
    contractMockState.decimals = 6;

    await transferToken(name, '1.0000005');

    expect(lastTransferAmount()).toBe(BigInt(1000000));
  });

  it('adds 15% headroom over the gas estimate', async () => {
    contractMockState.estimateGas = 65000;

    await transferToken(name, '1');

    const { gasLimit } = builtTxData.at(-1)!;
    expect(BigInt(gasLimit)).toBe(BigInt(74750));
  });

  it('signs with the nonce it is given, as for the next of several recipients', async () => {
    await transferToken(name, '1', { nonce: 4 });

    expect(Number(builtTxData.at(-1)!.nonce)).toBe(4);
  });
});

describe('Avalanche adapter transferToken transaction', () => {
  it('signs and broadcasts a legacy transaction with the expected token, fee, nonce, and chain', async () => {
    contractMockState.decimals = 6;

    const response = await transferToken('Avalanche', '1.5', { nonce: 4 });

    expect(lastTransferAmount()).toBe(BigInt(1500000));
    expect(contractMockState.transferCalls.at(-1)!.recipient).toBe(RECIPIENT);
    expect(broadcastSignedTransactionMock).toHaveBeenCalledTimes(1);

    const [web3Eth, raw] = broadcastSignedTransactionMock.mock.calls[0];
    expect(web3Eth).toBeDefined();
    expect(typeof raw).toBe('string');

    const signedTx = TransactionFactory.fromSerializedData(hexToBytes(raw));
    expect(response.hash).toBe(`0x${Buffer.from(signedTx.hash()).toString('hex')}`);
    expect(signedTx.common.chainId()).toBe(BigInt(43114));
    expect(signedTx.to?.toString()).toBe(TOKEN_CONTRACT);
    expect(signedTx.value).toBe(BigInt(0));
    expect(signedTx.nonce).toBe(BigInt(4));
    expect(signedTx.gasPrice).toBe(BigInt(30000000000));
    expect(signedTx.gasLimit).toBe(BigInt(74750));
    expect(BigInt(builtTxData.at(-1)!.gasPrice)).toBe(BigInt(30000000000));
  });
});
