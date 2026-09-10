import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
} from '@/constants';

/**
 * `vi.mock('@/composables/networks', ...)` is unreliable here: `registerAdapters.ts`
 * runs as a global vitest setupFile and its import graph resolves the REAL module
 * before this spec file's mock is hoisted into effect (see repo memory: "Vitest
 * composable mocks must precede registerAdapters import"). Driving the real
 * composable's own `switchNetwork` avoids the ordering problem entirely -- and,
 * unlike a static mock, actually proves the network-dependent branches work
 * (a mocked-MAINNET assertion would coincidentally pass even if the mock were
 * silently ignored, since MAINNET is also the real default).
 */
describe('BitcoinAdapter - network settings, token key, explorer', () => {
  const { switchNetwork } = useNetworks();
  const adapter = new BitcoinAdapter();

  afterEach(() => {
    switchNetwork(NETWORK_NAME_MAINNET);
  });

  it('returns coin token key and amount precision (8 decimals, standard for BTC)', () => {
    expect(adapter.getUrlTokenKey()).toBe('bitcoin');
    expect(adapter.getAmountPrecision()).toBe(8);
  });

  it('returns default network settings containing a nodeUrl for both network types', () => {
    expect(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_MAINNET)).toHaveProperty('nodeUrl');
    expect(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_TESTNET)).toHaveProperty('nodeUrl');
    expect(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_MAINNET).nodeUrl)
      .not.toBe(adapter.getNetworkTypeDefaultValues(NETWORK_TYPE_TESTNET).nodeUrl);
  });

  it('returns account prefix matching the REAL active network (bc1q mainnet / tb1q testnet)', () => {
    switchNetwork(NETWORK_NAME_MAINNET);
    expect(adapter.getAccountPrefix()).toBe('bc1q');

    switchNetwork(NETWORK_NAME_TESTNET);
    expect(adapter.getAccountPrefix()).toBe('tb1q');
  });

  it('builds a Blockstream explorer that links to the given account/tx directly', () => {
    const explorer = adapter.getExplorer();
    const addr = 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu';
    const txHash = 'deadbeef';

    expect(explorer.prepareUrlForAccount(addr)).toContain(addr);
    expect(explorer.prepareUrlForHash(txHash)).toContain(txHash);
  });

  it('getDefaultCoin reports the BTC symbol/precision/contractId consistently', () => {
    const coin = adapter.getDefaultCoin();
    expect(coin.symbol).toBe('BTC');
    expect(coin.decimals).toBe(8);
    expect(coin.contractId).toBe('bitcoin');
    expect(coin.protocol).toBe(PROTOCOLS.bitcoin);
  });
});
