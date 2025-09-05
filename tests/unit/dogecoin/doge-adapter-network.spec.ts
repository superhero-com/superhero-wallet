import { expect } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET, PROTOCOLS } from '../../../src/constants';

// default activeNetwork is MAINNET here to reflect default initialization
jest.mock('../../../src/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        type: NETWORK_TYPE_MAINNET,
        protocols: {
          [PROTOCOLS.dogecoin]: { nodeUrl: 'http://localhost:38332' },
        },
      },
    },
  }),
}));

describe('DogecoinAdapter - network defaults and token key', () => {
  const adapter = new DogecoinAdapter();
  it('returns coin token key and precision', () => {
    expect(typeof adapter.getUrlTokenKey()).toBe('string');
    expect(typeof adapter.getAmountPrecision()).toBe('number');
  });
  it('returns default settings', () => {
    expect(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_MAINNET as any)).toHaveProperty('nodeUrl');
    expect(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_TESTNET as any)).toHaveProperty('nodeUrl');
  });

  it('returns correct account prefix by network type', () => {
    // With mocked MAINNET above default, Doge uses "D" prefix
    expect(adapter.getAccountPrefix()).toBe('D');
  });
});
