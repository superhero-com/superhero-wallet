// @ts-nocheck
import { ref } from 'vue';

import '@/protocols/registerAdapters';
import { useCurrencies, useMultisigAccounts } from '@/composables';
import { useConnectionStatus } from '@/composables/connectionStatus';
import { useAeMiddleware, useAeTippingBackend } from '@/protocols/aeternity/composables';
import { isEtherscanUnavailable } from '@/protocols/ethereum/libs/EtherscanService';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import { tg } from '@/popup/plugins/i18n';

// The setup files already loaded the composables with the real deps; reload them to apply mocks.
const { realAccounts, route } = vi.hoisted(() => {
  vi.resetModules();
  return {
    realAccounts: { useAccounts: () => ({}) },
    route: { name: undefined },
  };
});

// Loaded in `beforeAll`: loading it in the factory would bind the composables barrel to it.
vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({ ...realAccounts.useAccounts(), isLoggedIn: ref(true) }),
}));

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal(),
  useRoute: () => route,
}));

vi.stubGlobal('fetch', () => new Promise(() => {}));

let isCurrenciesUnavailable;
let isMiddlewareUnavailable;
let middlewareStatus;
let isBackendUnavailable;
let isMultisigBackendUnavailable;

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  ({ isCurrenciesUnavailable } = useCurrencies({ pollingDisabled: true }));
  ({ isMiddlewareUnavailable, middlewareStatus } = useAeMiddleware());
  ({ isBackendUnavailable } = useAeTippingBackend());
  ({ isMultisigBackendUnavailable } = useMultisigAccounts({ pollingDisabled: true }));
});

beforeEach(() => {
  route.name = undefined;
  isCurrenciesUnavailable.value = false;
  isMiddlewareUnavailable.value = false;
  middlewareStatus.value = undefined;
  isBackendUnavailable.value = false;
  isMultisigBackendUnavailable.value = false;
  isEtherscanUnavailable.value = false;
});

const getStatusMessage = () => useConnectionStatus().status.value?.statusMessage;

describe('useConnectionStatus', () => {
  it('shows the prices banner when nothing else is wrong', () => {
    isCurrenciesUnavailable.value = true;

    expect(getStatusMessage()).toBe(tg('connectionStatus.currencies.statusMessage'));
  });

  it.each([
    ['the middleware is down', 'middleware.error.title', () => {
      isMiddlewareUnavailable.value = true;
    }],
    ['both backends are down', 'backend.statusMessage', () => {
      isBackendUnavailable.value = true;
      isMultisigBackendUnavailable.value = true;
    }],
    ['Etherscan is down', 'etherscan.statusMessage', () => {
      isEtherscanUnavailable.value = true;
    }],
    ['the multisig backend is down on the account page', 'multisig.statusMessage', () => {
      route.name = ROUTE_ACCOUNT;
      isMultisigBackendUnavailable.value = true;
    }],
    ['the aeternity backend is down', 'aeternityBackend.statusMessage', () => {
      isBackendUnavailable.value = true;
    }],
    ['the middleware is syncing', 'middleware.syncing.statusMessage', () => {
      middlewareStatus.value = { mdwSynced: false, nodeHeight: 100, mdwHeight: 90 };
    }],
  ])('shows that %s, not that the prices are outdated', (_, messageKey, setUp) => {
    isCurrenciesUnavailable.value = true;
    setUp();

    expect(getStatusMessage()).toBe(tg(`connectionStatus.${messageKey}`));
  });
});
