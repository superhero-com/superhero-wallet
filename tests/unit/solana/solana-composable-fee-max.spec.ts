import { ref } from 'vue';
import { useSolMaxAmount } from '@/protocols/solana/composables/solMaxAmount';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '@/constants';
import { expect, jest } from '@jest/globals';

jest.mock('@/composables/balances', () => ({
  useBalances: () => ({ balance: { value: '10' } }),
}));

jest.mock('@/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        protocols: { solana: { nodeUrl: 'https://api.testnet.solana.com', explorerUrl: '' } },
      },
    },
  }),
}));

// Provide a deterministic fee composable to avoid network calls and expose a stable fee ref
jest.mock('@/protocols/solana/composables/solFeeCalculation', () => ({
  useSolFeeCalculation: () => ({
    fee: ref(0.000005),
    feeSelectedIndex: ref(0),
    feeList: ref([]),
    maxFee: ref(0.000005),
    updateFeeList: jest.fn(),
  }),
}));

// Avoid hitting real network during fee calculation
jest.mock('@solana/web3.js', () => ({
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
const web3 = require('@solana/web3.js');
// eslint-disable-next-line no-param-reassign
web3.Connection.prototype.getLatestBlockhash = () => Promise.resolve({ blockhash: 'hash' });
// eslint-disable-next-line no-param-reassign
web3.Connection.prototype.getFeeForMessage = () => Promise.resolve({ value: 5000 });

describe('Solana composables - useSolMaxAmount', () => {
  it('computes max for SOL asset subtracting estimated fee and supports multiple recipients', async () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);
    const form = ref({
      amount: '0',
      selectedAsset: { contractId: adapter.coinContractId, decimals: adapter.coinPrecision },
      addresses: ['A', 'B'],
    } as any);

    const { max } = useSolMaxAmount(form as any) as any;
    // With mocked fee of 0.000005 SOL, two recipients => each half of (10 - fee)
    expect(Number(max.value)).toBeGreaterThan(4.999);
    expect(Number(max.value)).toBeLessThan(5.001);

    // If token selected, returns token balance unaffected by fee
    form.value.selectedAsset = { contractId: 'TokenMint', decimals: 6, amount: '1000000' } as any;
    expect(max.value).toBe('1');
  });
});
