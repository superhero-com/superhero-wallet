import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils';
import { nextTick, type Ref } from 'vue';
import { Contract } from '@aeternity/aepp-sdk';
import { useAssetDetails } from '@/composables';
import AssetDetails from '@/popup/pages/Assets/AssetDetails.vue';
import { createIonPage, setIonPageHidden } from '../../helpers/ionPage';

const COIN_ROUTE = {
  name: 'coin', params: { id: 'aeternity' }, meta: {}, matched: [{ name: 'coin' }],
};
const LP_TOKEN = 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z';
const TOKEN0 = 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd';
const TOKEN1 = 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu';

const mocks = vi.hoisted(() => ({
  marketData: undefined as unknown as Ref<Record<string, unknown> | null>,
  route: {} as Record<string, unknown>,
  availableTokens: {} as Record<string, unknown>,
}));

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => mocks.route,
}));
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('@/composables', async (importOriginal) => {
  const { ref } = await import('vue');
  mocks.marketData = ref(null);
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useAccounts: () => ({
      activeAccount: ref({ address: 'ak_1', protocol: 'aeternity' }),
      getLastActiveProtocolAccount: vi.fn(),
    }),
    useAccountAssetsList: () => ({ protocolCoinBalance: ref({ toNumber: () => 0 }) }),
    useAeSdk: () => ({
      isNodeMainnet: ref(false),
      isNodeTestnet: ref(true),
      getAeSdk: async () => ({ getContext: () => ({}) }),
    }),
    useCurrencies: () => ({ marketData: mocks.marketData }),
    useFungibleTokens: () => ({
      getAccountTokenBalance: vi.fn(),
      getProtocolAvailableTokens: () => mocks.availableTokens,
    }),
    useMultisigAccounts: () => ({ activeMultisigAccount: ref(undefined) }),
    usePendingMultisigTransaction: () => ({ pendingMultisigTransaction: ref(undefined) }),
    useUi: () => ({ setLoaderVisible: vi.fn() }),
  };
});

// jsdom has no ResizeObserver
vi.stubGlobal('ResizeObserver', class {
  observe() {} // eslint-disable-line class-methods-use-this

  disconnect() {} // eslint-disable-line class-methods-use-this
});
enableAutoUnmount(afterEach);

describe('AssetDetails', () => {
  beforeEach(() => {
    mocks.route = COIN_ROUTE;
    mocks.availableTokens = {};
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // The page can be left before the delayed observing starts
  it('observes the height of its tabs only while it is mounted', async () => {
    vi.useFakeTimers();
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const mountPage = () => shallowMount(AssetDetails, {
      attachTo: document.body,
      global: {
        mocks: { $t: (key: string) => key },
        // Renders the tabs
        stubs: { PageWrapper: { template: '<div><slot /></div>' } },
      },
    });

    mountPage().unmount();
    await vi.advanceTimersByTimeAsync(250);
    expect(observe).not.toHaveBeenCalled();

    const wrapper = mountPage();
    await vi.advanceTimersByTimeAsync(250);
    expect(observe).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('shares its details only while its page is shown', async () => {
    const { sharedAssetDetails, setSharedAssetDetails } = useAssetDetails();
    const page = createIonPage();
    shallowMount(AssetDetails, { attachTo: page, global: { mocks: { $t: (key: string) => key } } });
    expect(sharedAssetDetails.tokenData).toMatchObject({ contractId: 'aeternity' });

    // Another asset's page opened over it shares its own details
    await setIonPageHidden(page, true);
    setSharedAssetDetails({ contractId: 'ct_other', tokenData: { contractId: 'ct_other' } });
    mocks.marketData.value = { aeternity: { currentPrice: 1 } };
    await nextTick();
    expect(sharedAssetDetails.tokenData).toEqual({ contractId: 'ct_other' });

    await setIonPageHidden(page, false);
    expect(sharedAssetDetails).toMatchObject({
      contractId: 'aeternity',
      tokenData: { contractId: 'aeternity', currentPrice: 1 },
    });
  });

  it('shares the pool of a DEX token once it is loaded', async () => {
    mocks.route = {
      name: 'token', params: { id: LP_TOKEN }, meta: {}, matched: [{ name: 'token' }],
    };
    mocks.availableTokens = Object.fromEntries([LP_TOKEN, TOKEN0, TOKEN1]
      .map((contractId) => [contractId, { contractId, protocol: 'aeternity' }]));
    vi.spyOn(Contract, 'initialize').mockResolvedValue({
      balances: async () => ({ decodedResult: new Map([['ak_1', 1]]) }),
      balance: async () => ({ decodedResult: 1 }),
      token0: async () => ({ decodedResult: TOKEN0 }),
      token1: async () => ({ decodedResult: TOKEN1 }),
      get_reserves: async () => ({ decodedResult: { reserve0: 10, reserve1: 20 } }),
      total_supply: async () => ({ decodedResult: 2 }),
    } as never);
    const { sharedAssetDetails } = useAssetDetails();

    shallowMount(AssetDetails, {
      attachTo: createIonPage(),
      global: { mocks: { $t: (key: string) => key } },
    });
    await flushPromises();

    expect(sharedAssetDetails.tokenPairs).toMatchObject({
      token0: { contractId: TOKEN0, amount: '5' },
      token1: { contractId: TOKEN1, amount: '10' },
    });
    expect(sharedAssetDetails.tokens?.map(({ contractId }) => contractId))
      .toEqual([TOKEN0, TOKEN1, LP_TOKEN]);
  });
});
