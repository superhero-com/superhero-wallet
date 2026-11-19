import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AssetDetailsTransactions from '@/popup/pages/Assets/AssetDetailsTransactions.vue';
import TransactionList from '@/popup/components/TransactionList.vue';
import {
  ROUTE_COIN,
  ROUTE_COIN_TX_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_TOKEN,
  ROUTE_TOKEN_TX_DETAILS,
} from '@/popup/router/routeNames';

const { route, sharedAssetDetails, didEnter } = vi.hoisted(() => ({
  route: { name: '', params: {} as Record<string, string> },
  sharedAssetDetails: { isMultisig: false },
  didEnter: [] as (() => void)[],
}));

vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ionic/vue')>()),
  onIonViewDidEnter: (callback: () => void) => didEnter.push(callback),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => route,
}));
vi.mock('@/composables', async (importOriginal) => {
  const { ref } = await import('vue');
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useAccounts: () => ({ activeAccount: ref({ address: 'ak_1', protocol: 'aeternity' }) }),
    useAssetDetails: () => ({ sharedAssetDetails }),
    useMultisigAccounts: () => ({ activeMultisigAccount: ref({ gaAccountId: 'ak_2' }) }),
    useTransactionList: () => ({
      isEndReached: ref(false),
      isLoading: ref(false),
      transactionsLoadedAndPending: ref([]),
      loadCurrentPageTransactions: vi.fn(),
      initializeTransactionListPolling: vi.fn(),
      stopTransactionListPolling: vi.fn(),
    }),
  };
});

/** The transaction route the page gives its list, once Ionic shows the page */
async function getTransactionRoute(name: string, id: string, isMultisig = false) {
  Object.assign(route, { name, params: { id } });
  sharedAssetDetails.isMultisig = isMultisig;
  didEnter.length = 0;
  const wrapper = shallowMount(AssetDetailsTransactions, {
    global: { renderStubDefaultSlot: true },
  });
  didEnter.forEach((callback) => callback());
  await nextTick();
  return wrapper.getComponent(TransactionList).props('transactionRoute');
}

describe('AssetDetailsTransactions', () => {
  it('opens the transactions of a coin or a token over their own asset page', async () => {
    expect(await getTransactionRoute(ROUTE_COIN, 'aeternity'))
      .toEqual({ name: ROUTE_COIN_TX_DETAILS, params: { id: 'aeternity' } });
    expect(await getTransactionRoute(ROUTE_TOKEN, 'ct_1'))
      .toEqual({ name: ROUTE_TOKEN_TX_DETAILS, params: { id: 'ct_1' } });
  });

  it('leaves the multisig transactions to the multisig details route', async () => {
    expect(await getTransactionRoute(ROUTE_MULTISIG_COIN, 'aeternity', true)).toBeNull();
  });
});
