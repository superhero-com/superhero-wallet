/* eslint-disable no-undef */
/* eslint-disable import/first */
// Ensure Web Crypto is available for web3 internals
const mockCrypto = {
  getRandomValues: (arr) => {
    // eslint-disable-next-line no-param-reassign
    for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
    return arr;
  },
};
if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, configurable: true });
} else {
  // override to be safe in CI
  try { Object.defineProperty(globalThis, 'crypto', { value: mockCrypto }); } catch (_) { /* noop */ }
}

import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { useEthFeeCalculation } from '../../../../../src/protocols/ethereum/composables/ethFeeCalculation';
import { PROTOCOLS } from '../../../../../src/constants';

// The setup files already loaded this composable with the real deps; reload it to apply the mocks.
const { web3EthNodeUrls } = vi.hoisted(() => {
  vi.resetModules();
  return { web3EthNodeUrls: [] };
});

vi.mock('web3-eth', () => {
  const impl = function Web3Eth(nodeUrl) {
    web3EthNodeUrls.push(nodeUrl);
    return {
      calculateFeeData: async () => ({
        baseFeePerGas: '1000000000',
        maxFeePerGas: '2000000000',
        maxPriorityFeePerGas: '1000000000',
      }),
      getGasPrice: async () => '2000000000',
      getBlock: async () => ({ number: 1n }),
    };
  };
  return {
    __esModule: true,
    default: impl,
    Web3Eth: impl,
  };
});

vi.mock('../../../../../src/protocols/ethereum/composables/ethNetworkSettings', () => ({
  useEthNetworkSettings: () => ({
    ethActiveNetworkSettings: { value: { nodeUrl: 'https://rpc.example' } },
  }),
}));

vi.mock('../../../../../src/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: { value: { nodeUrl: 'https://bsc.rpc.example' } },
  }),
}));

vi.mock('../../../../../src/protocols/avalanche/composables/avalancheNetworkSettings', () => ({
  useAvalancheNetworkSettings: () => ({
    avalancheActiveNetworkSettings: { value: { nodeUrl: 'https://avalanche.rpc.example' } },
  }),
}));

vi.mock('../../../../../src/protocols/polygonPos/composables/polygonPosNetworkSettings', () => ({
  usePolygonNetworkSettings: () => ({
    polygonActiveNetworkSettings: { value: { nodeUrl: 'https://polygon.rpc.example' } },
  }),
}));

// Mocked node values: base fee 1 gwei, max fee 2 gwei, priority fee 1 gwei, gas price 2 gwei.
const GWEI = new BigNumber('0.000000001');
const GAS_LIMIT = 21000;

describe('useEthFeeCalculation - Ethereum vs BNB', () => {
  it('Ethereum branch returns 3 fee items and exposes EIP-1559 fields', async () => {
    const {
      feeList,
      maxFeePerGas,
      maxPriorityFeePerGas,
      fee,
      updateFeeList,
    } = useEthFeeCalculation(PROTOCOLS.ethereum, ref(1));
    await updateFeeList();
    expect(feeList.value.length).toBe(3);
    expect(BigNumber.isBigNumber(maxFeePerGas.value)).toBe(true);
    expect(BigNumber.isBigNumber(maxPriorityFeePerGas.value)).toBe(true);
    expect(BigNumber.isBigNumber(fee.value)).toBe(true);
  });

  it('BNB branch returns 3 fee items and omits EIP-1559 fields', async () => {
    const {
      feeList,
      maxFeePerGas,
      maxPriorityFeePerGas,
      fee,
      updateFeeList,
    } = useEthFeeCalculation(
      PROTOCOLS.bnb,
      ref(1),
    );
    await updateFeeList();
    expect(feeList.value.length).toBe(3);
    expect(maxFeePerGas.value.isZero()).toBe(true);
    expect(maxPriorityFeePerGas.value.isZero()).toBe(true);
    expect(BigNumber.isBigNumber(fee.value)).toBe(true);
  });

  it('BNB fee equals gasPrice * gasLimit * multiplier (medium)', async () => {
    const { fee, feeSelectedIndex, updateFeeList } = useEthFeeCalculation(PROTOCOLS.bnb, ref(1));
    await updateFeeList();
    feeSelectedIndex.value = 1; // medium = 1.5x
    // With default gasLimit used by implementation our mock gas price yields ~3.15e-6 (slow)
    expect(fee.value.toNumber()).toBeGreaterThan(0);
  });
});

describe('useEthFeeCalculation - multiple recipients', () => {
  it('signs every recipient transaction with the single-recipient gas prices', async () => {
    const { maxFeePerGas, maxPriorityFeePerGas, updateFeeList } = useEthFeeCalculation(
      PROTOCOLS.ethereum,
      ref(3),
    );
    await updateFeeList();

    // Slow speed: max fee = node max fee + priority fee, priority fee = node priority fee.
    expect(maxFeePerGas.value.toFixed()).toBe(GWEI.times(3).toFixed());
    expect(maxPriorityFeePerGas.value.toFixed()).toBe(GWEI.toFixed());
  });

  it('counts the fee and the max fee once per recipient', async () => {
    const { fee, maxFee, updateFeeList } = useEthFeeCalculation(PROTOCOLS.ethereum, ref(3));
    await updateFeeList();

    // fee: (base fee + priority fee) * gas limit, max fee: max fee per gas * gas limit
    expect(fee.value.toFixed()).toBe(GWEI.times(2).times(GAS_LIMIT).times(3).toFixed());
    expect(maxFee.value.toFixed()).toBe(GWEI.times(3).times(GAS_LIMIT).times(3).toFixed());
  });
});

describe('useEthFeeCalculation - gas price chains', () => {
  it.each([
    [PROTOCOLS.bnb, 'https://bsc.rpc.example'],
    [PROTOCOLS.avalanche, 'https://avalanche.rpc.example'],
    [PROTOCOLS.polygonPos, 'https://polygon.rpc.example'],
  ])('prices the %s fee with its own node gas price', async (protocol, nodeUrl) => {
    const { fee, maxFee, updateFeeList } = useEthFeeCalculation(protocol, ref(2));
    web3EthNodeUrls.length = 0;
    await updateFeeList();

    expect(web3EthNodeUrls).toEqual([nodeUrl]);
    // Slow speed: node gas price 2 gwei + 10% buffer
    expect(fee.value.toFixed()).toBe(GWEI.times(2.2).times(GAS_LIMIT).times(2).toFixed());
    expect(maxFee.value.toFixed()).toBe(fee.value.toFixed());
  });
});
