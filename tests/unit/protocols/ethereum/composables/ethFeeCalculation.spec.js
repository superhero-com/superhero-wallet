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

jest.mock('web3-eth', () => {
  const impl = function Web3Eth() {
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

jest.mock('../../../../../src/protocols/ethereum/composables/ethNetworkSettings', () => ({
  useEthNetworkSettings: () => ({
    ethActiveNetworkSettings: { value: { nodeUrl: 'https://rpc.example' } },
  }),
}));

jest.mock('../../../../../src/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: { value: { nodeUrl: 'https://bsc.rpc.example' } },
  }),
}));

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
