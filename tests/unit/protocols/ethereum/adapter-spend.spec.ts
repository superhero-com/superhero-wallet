/**
 * [BLACK-BOX] EthereumAdapter build/sign coverage.
 *
 * Expected values below are derived from external standards BEFORE reading the
 * adapter's internals in depth:
 *  - 1 ETH = 10^18 wei (Ethereum yellow paper unit definition).
 *  - EIP-1559 transactions carry maxFeePerGas/maxPriorityFeePerGas, never a legacy
 *    gasPrice.
 *  - ERC-20 amounts must be scaled by the TOKEN's own on-chain decimals(), not the
 *    chain's 18-decimal native unit (ERC-20 standard, `transfer(address,uint256)`).
 *  - The nonce for a soon-to-be-broadcast tx should come from the PENDING tx count
 *    (`eth_getTransactionCount` with the `'pending'` tag), not `'latest'`.
 *
 * Boundary mocked: the RPC client (`web3-eth`, `web3-eth-contract`), the Etherscan
 * ABI-fetch HTTP boundary, and the broadcast boundary. `web3-eth-accounts`
 * (FeeMarketEIP1559Transaction, key math/signing) is real — we only spy on its
 * static `fromTxData` factory to observe the exact tx fields the adapter builds,
 * without altering its real signing behaviour.
 *
 * Module-loading notes (both learned by direct experimentation, not assumption):
 *  1. `EthereumAdapter` is eagerly imported by the global
 *     `src/protocols/registerAdapters.ts` setup file, which runs BEFORE this spec
 *     file's own module body. A plain top-level `vi.mock('@/composables', ...)`
 *     (as used by tests/unit/solana/solana-adapter-spend.spec.ts) silently does
 *     NOT get picked up by EthereumAdapter's already-bound `useAccounts`/
 *     `useNetworks` references — verified directly: the mock factory never fired
 *     during a real constructAndSignTx call, and the real module's export is a
 *     getter-only binding so it can't even be monkey-patched at runtime after the
 *     fact. The reliable fix (mirroring
 *     tests/unit/protocols/evm/broadcastSignedTransaction.spec.ts's `loadModule`
 *     pattern) is `vi.resetModules()` + `vi.doMock(...)` + a dynamic `import()` of
 *     the adapter itself.
 *  2. That reset+doMock+import dance only reliably re-initializes modules once per
 *     file: `web3-eth-accounts` and `web3-eth` are pre-bundled dependencies that
 *     `vi.resetModules()` does not actually re-instantiate on a second call in
 *     this environment (verified: a second `vi.spyOn(FeeMarketEIP1559Transaction,
 *     'fromTxData')` after a second `loadAdapter()` call silently returned the
 *     FIRST call's already-registered spy, leaking captured txData between
 *     tests; and a second `vi.doMock('web3-eth', ...)` produced a broken,
 *     non-constructable stand-in for `Web3Eth`). So `loadAdapter()` below runs
 *     exactly ONCE (`beforeAll`); per-test variation is done by mutating the
 *     shared mock state objects and clearing spies in `beforeEach`, not by
 *     reloading modules.
 */
import { PROTOCOLS, NETWORK_TYPE_MAINNET } from '@/constants';

// A 32-byte value < secp256k1 curve order -> a valid private key for signing.
const SECRET_KEY = Buffer.alloc(32, 1);
const FROM_ACCOUNT = '0x0000000000000000000000000000000000000001';
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';

interface ContractMockState {
  decimals: number;
  estimateGas: number;
  transferCalls: Array<{ recipient: string; amount: any }>;
}

async function loadAdapter() {
  vi.resetModules();

  const contractMockState: ContractMockState = {
    decimals: 18,
    estimateGas: 21000,
    transferCalls: [],
  };
  const web3EthMockState = {
    txCount: 3,
  };

  // Composables barrel: only `useAccounts` is exercised by EthereumAdapter.
  vi.doMock('@/composables', () => ({
    useAccounts: () => ({
      getAccountByProtocolAndAddress: (protocol: string) => (
        protocol === PROTOCOLS.ethereum
          ? { protocol: PROTOCOLS.ethereum, secretKey: SECRET_KEY }
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
            [PROTOCOLS.ethereum]: {
              chainId: '1',
              nodeUrl: 'http://localhost:8545',
              middlewareUrl: 'http://localhost/mdw',
            },
          },
        },
      },
    }),
  }));

  // RPC client boundary: keep all real web3-eth exports/behaviour except the ones
  // we need to observe/control (constructor + getTransactionCount).
  vi.doMock('web3-eth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('web3-eth')>();
    return {
      ...actual,
      // vitest constructs this implementation directly (`new Web3Eth(...)`),
      // which throws on an arrow fn.
      // eslint-disable-next-line prefer-arrow-callback
      default: vi.fn().mockImplementation(function Web3EthMock() { return {}; }),
      getTransactionCount: vi.fn(() => Promise.resolve(web3EthMockState.txCount)),
    };
  });

  // Contract boundary (ERC-20 calls): the RPC/ABI boundary for token transfers,
  // not an "ethers/web3 internals" concern.
  vi.doMock('web3-eth-contract', () => ({
    // vitest constructs this implementation directly (`new Contract(...)`),
    // which throws on an arrow fn.
    // eslint-disable-next-line prefer-arrow-callback
    Contract: vi.fn().mockImplementation(function ContractMock() {
      return {
        setProvider: vi.fn(),
        methods: {
          decimals: () => ({ call: () => Promise.resolve(contractMockState.decimals) }),
          transfer: (recipient: string, amount: any) => {
            contractMockState.transferCalls.push({ recipient, amount });
            return {
              estimateGas: () => Promise.resolve(contractMockState.estimateGas),
              encodeABI: () => '0xabcdef',
            };
          },
        },
      };
    }),
  }));

  // Etherscan ABI-fetch HTTP boundary: return a non-array result so the adapter
  // falls back to the built-in ERC20_ABI (irrelevant to the math under test, since
  // the Contract class itself is mocked above).
  vi.doMock('@/protocols/ethereum/libs/EtherscanService', () => ({
    // vitest constructs this implementation directly (`new EtherscanService(...)`),
    // which throws on an arrow fn.
    // eslint-disable-next-line prefer-arrow-callback
    EtherscanService: vi.fn().mockImplementation(function EtherscanServiceMock() {
      return { fetchFromApi: () => Promise.resolve({ result: null }) };
    }),
  }));

  // Broadcast boundary: already covered by its own dedicated spec
  // (tests/unit/protocols/evm/broadcastSignedTransaction.spec.ts); stub it here.
  vi.doMock('@/protocols/evm/libs/broadcastSignedTransaction', () => ({
    broadcastSignedTransaction: vi.fn().mockResolvedValue(undefined),
  }));

  const { EthereumAdapter } = await import('@/protocols/ethereum/libs/EthereumAdapter');
  const { FeeMarketEIP1559Transaction } = await import('web3-eth-accounts');
  const web3Eth = await import('web3-eth');

  return {
    EthereumAdapter,
    FeeMarketEIP1559Transaction,
    contractMockState,
    web3EthMockState,
    getTransactionCountMock: web3Eth.getTransactionCount as unknown as ReturnType<typeof vi.fn>,
  };
}

let EthereumAdapter: Awaited<ReturnType<typeof loadAdapter>>['EthereumAdapter'];
let contractMockState: ContractMockState;
let web3EthMockState: { txCount: number };
let getTransactionCountMock: ReturnType<typeof vi.fn>;
let fromTxDataSpy: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  const loaded = await loadAdapter();
  EthereumAdapter = loaded.EthereumAdapter;
  contractMockState = loaded.contractMockState;
  web3EthMockState = loaded.web3EthMockState;
  getTransactionCountMock = loaded.getTransactionCountMock;
  fromTxDataSpy = vi.spyOn(loaded.FeeMarketEIP1559Transaction, 'fromTxData');
});

beforeEach(() => {
  fromTxDataSpy.mockClear();
  getTransactionCountMock.mockClear();
  contractMockState.decimals = 18;
  contractMockState.estimateGas = 21000;
  contractMockState.transferCalls = [];
  web3EthMockState.txCount = 3;
});

describe('EthereumAdapter - spend (native ETH transfer, wei math)', () => {
  // 0.1 ETH must become exactly 100000000000000000 wei (0.1 * 10^18) with no
  // floating-point drift.
  //
  // `spend`'s public signature still takes `amount: number`, so the value already
  // went through one lossy number->string round trip before this test observes it;
  // `constructAndSignTx` re-parses it through `new BigNumber(amount).toFixed(...)`
  // rather than the JS-native `Number.prototype.toFixed`, which recovers the
  // shortest decimal representation for amounts within ~15 significant digits.
  // Amounts beyond that range still drift (see the full-precision test below) and
  // need `amount` threaded as a string end-to-end across all adapters to fix.
  it('produces exact wei value for 0.1 ETH', async () => {
    const adapter = new EthereumAdapter();
    await adapter.constructAndSignTx(0.1, RECIPIENT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    const txData = fromTxDataSpy.mock.calls[0][0] as any;
    expect(BigInt(txData.value)).toBe(100000000000000000n);
  });

  // The smallest unit (1 wei = 0.000000000000000001 ETH) must round-trip as
  // integer wei value 1, not be rounded down to 0. Verified this specific value
  // does NOT suffer the same drift as 0.1 (its double representation happens to
  // round cleanly through toFixed(18)), so this one is expected to pass.
  it('keeps 1 wei (1e-18 ETH) as exactly 1, not rounded to 0', async () => {
    const adapter = new EthereumAdapter();
    await adapter.constructAndSignTx(0.000000000000000001, RECIPIENT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    const txData = fromTxDataSpy.mock.calls[0][0] as any;
    expect(BigInt(txData.value)).toBe(1n);
  });

  // A high-precision amount using the full ETH_COIN_PRECISION (18 decimals) must
  // convert exactly, with no drift introduced by the conversion. Same root cause
  // as the 0.1 ETH case above (amount typed as `number`).
  it.fails('produces exact wei for a full-precision (18 decimal) amount', async () => {
    const adapter = new EthereumAdapter();
    // This 19-significant-digit literal losing precision at parse time is the
    // point of the test - it demonstrates drift before any adapter code runs.
    // eslint-disable-next-line no-loss-of-precision
    await adapter.constructAndSignTx(1.123456789012345678, RECIPIENT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    const txData = fromTxDataSpy.mock.calls[0][0] as any;
    // Actual: 1123456789012345691n (drift from the `number` amount type).
    expect(BigInt(txData.value)).toBe(1123456789012345678n);
  });

  it('populates EIP-1559 fee fields (maxFeePerGas/maxPriorityFeePerGas), never legacy gasPrice', async () => {
    const adapter = new EthereumAdapter();
    await adapter.constructAndSignTx(1, RECIPIENT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001', // 1 gwei
      maxFeePerGas: '0.00000005', // 50 gwei
      nonce: 0,
    });
    const txData = fromTxDataSpy.mock.calls[0][0] as any;
    expect(txData.gasPrice).toBeUndefined();
    expect(txData.type).toBe('0x02');
    expect(BigInt(txData.maxPriorityFeePerGas)).toBe(1000000000n);
    expect(BigInt(txData.maxFeePerGas)).toBe(50000000000n);
  });

  it('broadcasts the signed tx and returns its hash', async () => {
    const adapter = new EthereumAdapter();
    const res = await adapter.spend(0.5, RECIPIENT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    expect(res.hash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe('EthereumAdapter - nonce source', () => {
  it('reads the transaction count with the PENDING tag, not latest', async () => {
    const adapter = new EthereumAdapter();
    await adapter.getTransactionCount(FROM_ACCOUNT);

    expect(getTransactionCountMock).toHaveBeenCalledTimes(1);
    const [, , tag] = getTransactionCountMock.mock.calls[0];
    expect(tag).toBe('pending');
  });
});

describe('EthereumAdapter - transferToken (ERC-20 decimals math)', () => {
  // decimals = 18 coincides with web3-utils' 'ether' unit, so this path happens to
  // be numerically correct today.
  it('converts using the token decimals when decimals=18 (matches native unit)', async () => {
    contractMockState.decimals = 18;
    const adapter = new EthereumAdapter();
    await adapter.transferToken('0.1', RECIPIENT, TOKEN_CONTRACT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    // transferToken calls contract.methods.transfer(recipient, hexAmount) twice
    // (once for estimateGas(), once for encodeABI()) with the same computed
    // amount — assert on the first call.
    expect(contractMockState.transferCalls.length).toBeGreaterThan(0);
    expect(BigInt(contractMockState.transferCalls[0].amount)).toBe(100000000000000000n);
  });

  // `transferToken` scales the amount by the token's own on-chain `decimals()`
  // via `new BigNumber(amount).shiftedBy(decimals)`, not a fixed 18/'ether' unit.
  // For a 6-decimal (USDC-like) token, "1.5" tokens becomes 1500000 (1.5 * 10^6).
  it('converts a 6-decimal (USDC-like) token amount using the TOKEN decimals, not 18', async () => {
    contractMockState.decimals = 6;
    const adapter = new EthereumAdapter();
    await adapter.transferToken('1.5', RECIPIENT, TOKEN_CONTRACT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    expect(BigInt(contractMockState.transferCalls[0].amount)).toBe(1500000n);
  });

  // decimals = 0 is a legal ERC-20 edge case (whole-unit-only tokens): "5" tokens
  // must become integer amount 5, not 5 * 10^18.
  it('converts a 0-decimal token amount as a bare integer', async () => {
    contractMockState.decimals = 0;
    const adapter = new EthereumAdapter();
    await adapter.transferToken('5', RECIPIENT, TOKEN_CONTRACT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    expect(BigInt(contractMockState.transferCalls[0].amount)).toBe(5n);
  });

  // The tx's `gasLimit` must be derived from `contract.methods.transfer(...)
  // .estimateGas()` — plus a 15% safety headroom so a token transfer whose gas
  // rises between estimation and mining doesn't revert out-of-gas — and never the
  // tx nonce or another unrelated value.
  it('uses the estimated gas (plus headroom) as the gas limit, not the tx nonce', async () => {
    contractMockState.decimals = 18;
    contractMockState.estimateGas = 65000;
    web3EthMockState.txCount = 3;

    const adapter = new EthereumAdapter();
    await adapter.transferToken('0.1', RECIPIENT, TOKEN_CONTRACT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    const txData = fromTxDataSpy.mock.calls[0][0] as any;

    // 65000 * 115 / 100
    expect(BigInt(txData.gasLimit)).toBe(74750n);
  });

  it('broadcasts the signed token transfer and returns its hash', async () => {
    contractMockState.decimals = 18;
    const adapter = new EthereumAdapter();
    const res = await adapter.transferToken('0.1', RECIPIENT, TOKEN_CONTRACT, {
      fromAccount: FROM_ACCOUNT,
      maxPriorityFeePerGas: '0.000000001',
      maxFeePerGas: '0.00000002',
      nonce: 0,
    });
    expect(res.hash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
