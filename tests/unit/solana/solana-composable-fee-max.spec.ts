import { ref } from 'vue';
import { useSolMaxAmount } from '@/protocols/solana/composables/solMaxAmount';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '@/constants';

vi.mock('@/composables/balances', () => ({
  useBalances: () => ({ balance: { value: '10' } }),
}));

vi.mock('@/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        protocols: { solana: { nodeUrl: 'https://api.testnet.solana.com', explorerUrl: '' } },
      },
    },
  }),
}));

const { updateFeeListMock } = vi.hoisted(() => ({ updateFeeListMock: vi.fn() }));

// Deterministic fee composable that mirrors the real one's timing: `fee` starts at 0
// and only becomes non-zero once `updateFeeList()` is called. This is what lets the
// tests below detect a regression where `useSolMaxAmount` forgets to prime the fee on
// setup (which would leave `max` overstated by the fee headroom until a field edit).
vi.mock('@/protocols/solana/composables/solFeeCalculation', () => ({
  useSolFeeCalculation: () => {
    const fee = ref(0);
    updateFeeListMock.mockImplementation(() => { fee.value = 0.000005; });
    return {
      fee,
      feeSelectedIndex: ref(0),
      feeList: ref([]),
      maxFee: fee,
      updateFeeList: updateFeeListMock,
    };
  },
}));

// Avoid hitting real network during fee calculation
vi.mock('@solana/web3.js', () => ({
  Connection: function MockConnection() {},
  LAMPORTS_PER_SOL: 1_000_000_000,
  PublicKey: function MockPublicKey() {},
  SystemProgram: { transfer: () => ({}) },
  Transaction: function MockTransaction(this: any) {
    // method stubs on instance
    this.add = () => this;
    this.compileMessage = () => ({});
  },
}));

// Patch prototype methods to satisfy lints about class methods
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const web3 = (await import('@solana/web3.js'));
// eslint-disable-next-line no-param-reassign
web3.Connection.prototype.getLatestBlockhash = () => Promise.resolve({ blockhash: 'hash' });
// eslint-disable-next-line no-param-reassign
web3.Connection.prototype.getFeeForMessage = () => Promise.resolve({ value: 5000 });

function makeSolForm() {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);
  return ref({
    amount: '0',
    selectedAsset: { contractId: adapter.coinContractId, decimals: adapter.coinPrecision },
    addresses: ['A', 'B'],
  } as any);
}

describe('Solana composables - useSolMaxAmount', () => {
  beforeEach(() => {
    updateFeeListMock.mockClear();
  });

  it('computes max for SOL asset subtracting estimated fee and supports multiple recipients', async () => {
    const form = makeSolForm();

    const { max } = useSolMaxAmount(form as any) as any;
    // With mocked fee of 0.000005 SOL, two recipients => each half of (10 - fee)
    expect(Number(max.value)).toBeGreaterThan(4.999);
    expect(Number(max.value)).toBeLessThan(5.001);

    // The SOL fee is not taken from the token balance, but each recipient still
    // receives the full amount, so max is balance / recipients.
    form.value.selectedAsset = { contractId: 'TokenMint', decimals: 6, amount: '1000000' } as any;
    expect(max.value).toBe('0.5');
  });

  it('floors the token max to the token decimals when it does not divide evenly', () => {
    // 1 / 3 must floor to the mint's 6 decimals.
    const form = makeSolForm();
    form.value.addresses = ['A', 'B', 'C'];
    form.value.selectedAsset = { contractId: 'TokenMint', decimals: 6, amount: '1000000' } as any;

    const { max } = useSolMaxAmount(form as any) as any;

    expect(max.value).toBe('0.333333');
  });

  it('floors the max instead of rounding it up past the balance', () => {
    // Native SOL branch: (10 - 0.000005) / 2 = 4.9999975 floors to 4.9; HALF_UP
    // gives 5.0 - over balance.
    const form = makeSolForm();
    form.value.selectedAsset = { contractId: form.value.selectedAsset.contractId, decimals: 1 };

    const { max } = useSolMaxAmount(form as any) as any;

    expect(max.value).toBe('4.9');
  });

  it('primes the fee on setup so max excludes fee headroom before any field edit', () => {
    const form = makeSolForm();

    const { max } = useSolMaxAmount(form as any) as any;

    // The fee must be fetched immediately, not only after a formModel change.
    expect(updateFeeListMock).toHaveBeenCalled();
    // With the fee applied, per-recipient max is strictly below balance/recipients (10/2).
    // If the setup fetch is dropped, fee stays 0 and this would be exactly 5.
    expect(Number(max.value)).toBeLessThan(5);
    expect(Number(max.value)).toBeGreaterThan(4.999);
  });
});
