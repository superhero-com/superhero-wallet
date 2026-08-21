/**
 * [BLACK-BOX] Polygon & BNB ERC-20 transfer encoding: token-decimals scaling and gas
 * headroom.
 *
 * Both adapters share one `loadAdapter()` - re-running the reset+doMock dance in one
 * file is unreliable (see tests/unit/protocols/ethereum/adapter-spend.spec.ts). RPC,
 * contract calls and broadcast are mocked; `web3-eth-accounts` signing stays real, so
 * only the built tx fields are observed.
 */
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

async function loadAdapter() {
  vi.resetModules();

  vi.doMock('@/composables', () => ({
    useAccounts: () => ({
      getAccountByProtocolAndAddress: (protocol: string) => (
        [PROTOCOLS.polygonPos, PROTOCOLS.bnb].includes(protocol as any)
          ? { protocol, secretKey: SECRET_KEY }
          : undefined
      ),
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
    broadcastSignedTransaction: vi.fn().mockResolvedValue(undefined),
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
  return { PolygonAdapter, BnbAdapter };
}

const adapters: Record<string, any> = {};

beforeAll(async () => {
  const { PolygonAdapter, BnbAdapter } = await loadAdapter();
  adapters.Polygon = new PolygonAdapter();
  adapters.BNB = new BnbAdapter();
});

beforeEach(() => {
  contractMockState.decimals = 18;
  contractMockState.estimateGas = 65000;
  contractMockState.transferCalls.length = 0;
  builtTxData.length = 0;
});

const transferToken = (
  name: string,
  amount: string,
) => adapters[name].transferToken(amount, RECIPIENT, TOKEN_CONTRACT, {
  fromAccount: FROM_ACCOUNT,
  maxPriorityFeePerGas: '0.000000002',
  maxFeePerGas: '0.00000003',
});

const lastTransferAmount = () => BigInt(
  contractMockState.transferCalls.at(-1)!.amount as string,
);

describe.each(['Polygon', 'BNB'])('%s adapter transferToken', (name) => {
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
});
