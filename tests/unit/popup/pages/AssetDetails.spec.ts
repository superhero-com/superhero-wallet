import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import { nextTick, type Ref } from 'vue';
import { useAssetDetails } from '@/composables';
import AssetDetails from '@/popup/pages/Assets/AssetDetails.vue';
import { createIonPage, setIonPageHidden } from '../../helpers/ionPage';

const mocks = vi.hoisted(() => ({
  marketData: undefined as unknown as Ref<Record<string, unknown> | null>,
}));

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({
    name: 'coin', params: { id: 'aeternity' }, meta: {}, matched: [{ name: 'coin' }],
  }),
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
    useAeSdk: () => ({ isNodeMainnet: ref(false), isNodeTestnet: ref(true), getAeSdk: vi.fn() }),
    useCurrencies: () => ({ marketData: mocks.marketData }),
    useFungibleTokens: () => ({
      getAccountTokenBalance: vi.fn(),
      getProtocolAvailableTokens: () => ({}),
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
});
