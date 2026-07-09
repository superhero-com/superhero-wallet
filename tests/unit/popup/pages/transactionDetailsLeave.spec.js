import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';

import AccountDetailsTransactionsBase from '../../../../src/popup/components/AccountDetailsTransactionsBase.vue';
import AccountDetailsMultisigTransactions from '../../../../src/popup/pages/AccountDetailsMultisigTransactions.vue';
import AssetDetailsTransactions from '../../../../src/popup/pages/Assets/AssetDetailsTransactions.vue';
import {
  ROUTE_ACCOUNT,
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_ASSETS,
  ROUTE_COIN,
  ROUTE_COIN_DETAILS,
  ROUTE_MULTISIG_ACCOUNT,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_ASSETS,
  ROUTE_TOKEN,
  ROUTE_TOKEN_DETAILS,
} from '../../../../src/popup/router/routeNames';

let mockDidEnterCallback;
let mockDidLeaveCallback;

const mockRoute = {
  name: ROUTE_ACCOUNT_DETAILS,
  params: { id: 'ae' },
};

const mockInitializeTransactionListPolling = vi.fn();
const mockStopTransactionListPolling = vi.fn();

vi.mock('@ionic/vue', async () => ({
  ...(await vi.importActual('@ionic/vue')),
  IonPage: { name: 'IonPage', template: '<div><slot /></div>' },
  isPlatform: vi.fn(() => false),
  onIonViewDidEnter: vi.fn((callback) => {
    mockDidEnterCallback = callback;
  }),
  onIonViewDidLeave: vi.fn((callback) => {
    mockDidLeaveCallback = callback;
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: vi.fn(() => ({ coinContractId: 'ae' })),
  },
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({
    activeAccount: {
      value: {
        address: 'ak_account',
        protocol: 'aeternity',
      },
    },
  }),
  useAssetDetails: () => ({
    sharedAssetDetails: {
      isMultisig: false,
    },
  }),
  useMultisigAccounts: () => ({
    activeMultisigAccount: {
      value: {
        gaAccountId: 'ak_multisig',
      },
    },
  }),
  usePendingMultisigTransaction: () => ({
    pendingMultisigTransaction: { value: null },
  }),
  useTransactionList: () => ({
    transactionsLoaded: { value: [] },
    transactionsLoadedAndPending: { value: [] },
    isEndReached: { value: false },
    isLoading: { value: false },
    loadCurrentPageTransactions: vi.fn(),
    initializeTransactionListPolling: mockInitializeTransactionListPolling,
    stopTransactionListPolling: mockStopTransactionListPolling,
  }),
}));

function mountPage(Component, sourceRouteName) {
  mockRoute.name = sourceRouteName;
  mockDidEnterCallback = undefined;
  mockDidLeaveCallback = undefined;

  const wrapper = shallowMount(Component);
  mockDidEnterCallback();

  return nextTick().then(() => wrapper);
}

async function expectTransactionListLeaveBehavior(Component, {
  sourceRouteName,
  tabRouteName,
  outsideRouteName,
}) {
  let wrapper = await mountPage(Component, sourceRouteName);

  expect(wrapper.vm.isPageActive).toBe(true);

  mockRoute.name = tabRouteName;
  mockDidLeaveCallback();
  await nextTick();

  expect(wrapper.vm.isPageActive).toBe(false);
  expect(mockStopTransactionListPolling).toHaveBeenCalledTimes(1);
  wrapper.unmount();

  mockStopTransactionListPolling.mockClear();

  wrapper = await mountPage(Component, sourceRouteName);
  expect(wrapper.vm.isPageActive).toBe(true);

  mockRoute.name = outsideRouteName;
  mockDidLeaveCallback();
  await nextTick();

  expect(wrapper.vm.isPageActive).toBe(true);
  expect(mockStopTransactionListPolling).not.toHaveBeenCalled();
  wrapper.unmount();
}

async function expectCachedRouteGroupSwitchInitializes(Component, {
  firstRouteName,
  secondRouteName,
}) {
  const firstWrapper = await mountPage(Component, firstRouteName);

  expect(mockInitializeTransactionListPolling).toHaveBeenCalledTimes(1);

  mockRoute.name = secondRouteName;
  mockDidLeaveCallback();
  await nextTick();

  expect(firstWrapper.vm.isPageActive).toBe(true);

  mockInitializeTransactionListPolling.mockClear();

  const secondWrapper = await mountPage(Component, secondRouteName);

  expect(secondWrapper.vm.isPageActive).toBe(true);
  expect(mockInitializeTransactionListPolling).toHaveBeenCalledTimes(1);

  firstWrapper.unmount();
  secondWrapper.unmount();
}

describe('transaction details leave behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.params = { id: 'ae' };
  });

  it('keeps regular account transactions mounted when leaving account details', async () => {
    await expectTransactionListLeaveBehavior(AccountDetailsTransactionsBase, {
      sourceRouteName: ROUTE_ACCOUNT_DETAILS,
      tabRouteName: ROUTE_ACCOUNT_DETAILS_ASSETS,
      outsideRouteName: ROUTE_ACCOUNT,
    });
  });

  it('keeps multisig account transactions mounted when leaving multisig details', async () => {
    await expectTransactionListLeaveBehavior(AccountDetailsMultisigTransactions, {
      sourceRouteName: ROUTE_MULTISIG_DETAILS,
      tabRouteName: ROUTE_MULTISIG_DETAILS_ASSETS,
      outsideRouteName: ROUTE_MULTISIG_ACCOUNT,
    });
  });

  it('keeps multisig coin transactions mounted when leaving multisig coin details', async () => {
    await expectTransactionListLeaveBehavior(AccountDetailsMultisigTransactions, {
      sourceRouteName: ROUTE_MULTISIG_COIN,
      tabRouteName: ROUTE_MULTISIG_COIN_DETAILS,
      outsideRouteName: ROUTE_MULTISIG_DETAILS_ASSETS,
    });
  });

  it('keeps coin transactions mounted when leaving coin details', async () => {
    await expectTransactionListLeaveBehavior(AssetDetailsTransactions, {
      sourceRouteName: ROUTE_COIN,
      tabRouteName: ROUTE_COIN_DETAILS,
      outsideRouteName: ROUTE_ACCOUNT_DETAILS_ASSETS,
    });
  });

  it('keeps token transactions mounted when leaving token details', async () => {
    await expectTransactionListLeaveBehavior(AssetDetailsTransactions, {
      sourceRouteName: ROUTE_TOKEN,
      tabRouteName: ROUTE_TOKEN_DETAILS,
      outsideRouteName: ROUTE_ACCOUNT_DETAILS_ASSETS,
    });
  });

  it('initializes polling for cached multisig pages mounted across route groups', async () => {
    await expectCachedRouteGroupSwitchInitializes(AccountDetailsMultisigTransactions, {
      firstRouteName: ROUTE_MULTISIG_DETAILS,
      secondRouteName: ROUTE_MULTISIG_COIN,
    });
  });

  it('initializes polling for cached asset pages mounted across route groups', async () => {
    await expectCachedRouteGroupSwitchInitializes(AssetDetailsTransactions, {
      firstRouteName: ROUTE_COIN,
      secondRouteName: ROUTE_TOKEN,
    });
  });
});
