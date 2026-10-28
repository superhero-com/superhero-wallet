// @ts-nocheck
import { ref } from 'vue';

/**
 * The tokens available on every protocol in use are loaded together.
 * Runs the real composable, networks and adapters; fakes the accounts and the APIs.
 */
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };
const ETH_TOKEN = {
  contractId: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  decimals: 6,
  name: 'Tether USD',
  symbol: 'USDT',
  protocol: 'ethereum',
};

describe('useFungibleTokens available tokens', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({ getAeSdk: vi.fn(), isTippingSupported: ref(true) }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accounts: ref([ACCOUNT]),
        protocolsInUse: ref(['aeternity', 'ethereum']),
        getLastActiveProtocolAccount: () => ACCOUNT,
      }),
    }));
    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.doUnmock('@/composables/accounts');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads the tokens of the other protocols when the aeternity token list fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => (url.includes('/v2/aex9')
      ? new Response('Internal Server Error', { status: 500 })
      : new Response('{}', { status: 200 }))));
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    vi.spyOn(ProtocolAdapterFactory.getAdapter('ethereum'), 'fetchAvailableTokens')
      .mockResolvedValue([ETH_TOKEN]);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { useFungibleTokens } = await import('@/composables/fungibleTokens');
    const { loadAvailableTokens, tokensAvailable } = useFungibleTokens();

    await loadAvailableTokens();

    expect(tokensAvailable.value.ethereum).toEqual({ [ETH_TOKEN.contractId]: ETH_TOKEN });
    expect(warn).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ statusCode: 500 }));
  });
});
