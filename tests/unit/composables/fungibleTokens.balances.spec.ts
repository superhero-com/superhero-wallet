// @ts-nocheck
import { ref } from 'vue';

/**
 * Token balances of every account are polled. A failed fetch keeps what is shown.
 * Runs the real composable, networks and adapters; fakes the accounts and the fetches.
 */
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };

function tokenBalance(contractId, amount = '1') {
  return {
    address: ACCOUNT.address,
    protocol: 'aeternity',
    contractId,
    amount,
    convertedBalance: Number(amount),
    decimals: 0,
    symbol: 'TKN',
    name: 'Token',
    price: 0,
  };
}

describe('useFungibleTokens token balances', () => {
  let adapter;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({ getAeSdk: vi.fn(), isTippingSupported: ref(true) }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accounts: ref([ACCOUNT]),
        protocolsInUse: ref(['aeternity']),
        getLastActiveProtocolAccount: () => ACCOUNT,
      }),
    }));
    await import('@/protocols/registerAdapters');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    adapter = ProtocolAdapterFactory.getAdapter('aeternity');
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.doUnmock('@/composables/accounts');
    vi.restoreAllMocks();
  });

  async function useFungibleTokens() {
    return (await import('@/composables/fungibleTokens')).useFungibleTokens();
  }

  /** Reload the modules with stored token balances, as when the app opens */
  async function loadStoredTokenBalances(networkName) {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    WalletStorage.set(STORAGE_KEYS.fungibleTokenBalances, [tokenBalance('ct_stored')]);
    WalletStorage.set(STORAGE_KEYS.fungibleTokenBalancesNetworkName, networkName);
    vi.resetModules();
    await import('@/protocols/registerAdapters');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const result = await useFungibleTokens();
    await new Promise((resolve) => { setTimeout(resolve); });
    expect(result.tokenBalances.value).toEqual([tokenBalance('ct_stored')]);
    return result;
  }

  it('keeps cached balances when an adapter returns null', async () => {
    vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')])
      .mockResolvedValueOnce(null);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();

    await loadTokenBalances();
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
  });

  it('keeps cached aeternity token balances when the middleware fails', async () => {
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();
    await loadTokenBalances();

    fetchSpy.mockRestore();
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
  });

  it('keeps the stored balances of the active network when an adapter returns null', async () => {
    const { tokenBalances, loadTokenBalances } = await loadStoredTokenBalances('Mainnet');
    vi.spyOn(adapter, 'fetchAccountTokenBalances').mockResolvedValue(null);

    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_stored')]);
  });

  it('does not keep the stored balances of another network when an adapter returns null', async () => {
    const { tokenBalances, loadTokenBalances } = await loadStoredTokenBalances('Testnet');
    vi.spyOn(adapter, 'fetchAccountTokenBalances').mockResolvedValue(null);

    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([]);
  });

  it('replaces the balances with an empty list when the account has no tokens', async () => {
    vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')])
      .mockResolvedValueOnce([]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();

    await loadTokenBalances();
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([]);
  });
});
