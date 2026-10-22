// @ts-nocheck
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import '@/popup/plugins/veeValidate';
import { ROUTE_NETWORK_EDIT } from '@/popup/router/routeNames';
import { useNetworks } from '@/composables/networks';
import NetworkForm from '@/popup/pages/NetworkForm.vue';

/**
 * Editing the active custom network with the real networks store and form rules.
 */
const OLD_MIDDLEWARE_URL = 'https://old-mdw.example';
const NEW_MIDDLEWARE_URL = 'https://new-mdw.example';

const router = { replace: vi.fn() };
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: ROUTE_NETWORK_EDIT, params: { name: 'Custom A' }, query: {} }),
  useRouter: () => router,
}));

enableAutoUnmount(afterEach);

async function mountEditingActiveNetwork() {
  const { networks, addCustomNetwork, switchNetwork } = useNetworks();
  const protocols = cloneDeep(networks.value.Testnet.protocols);
  // The form requires an explorer for every protocol
  Object.keys(protocols).forEach((protocol) => {
    protocols[protocol] = { explorerUrl: 'https://explorer.example', ...protocols[protocol] };
  });
  protocols.aeternity.middlewareUrl = OLD_MIDDLEWARE_URL;
  addCustomNetwork({ name: 'Custom A', type: 'custom', protocols });
  switchNetwork('Custom A');

  const wrapper = mount(NetworkForm, {
    global: {
      mocks: { $t: (key) => key },
      stubs: { PageWrapper: { template: '<div><slot /></div>' } },
    },
  });
  await flushPromises();
  await wrapper
    .find('[data-cy="group-aeternity"] [data-cy="middlewareUrl"] input')
    .setValue(NEW_MIDDLEWARE_URL);
  return wrapper;
}

describe('NetworkForm editing the active network', () => {
  afterEach(() => {
    const { customNetworks, activeNetworkName } = useNetworks();
    activeNetworkName.value = 'Mainnet';
    customNetworks.value = [];
    router.replace.mockReset();
  });

  it('keeps the network as it was when the edit is cancelled', async () => {
    const wrapper = await mountEditingActiveNetwork();

    await wrapper.find('[data-cy="cancel"]').trigger('click');

    const { activeNetwork, customNetworks } = useNetworks();
    expect(router.replace).toHaveBeenCalled();
    expect(customNetworks.value[0].protocols.aeternity.middlewareUrl).toBe(OLD_MIDDLEWARE_URL);
    expect(activeNetwork.value.protocols.aeternity.middlewareUrl).toBe(OLD_MIDDLEWARE_URL);
  });

  it('saves the edit and passes the previous settings as the old network', async () => {
    const { onNetworkChange, activeNetwork } = useNetworks();
    const callback = vi.fn();
    const unsubscribe = onNetworkChange(callback);
    const wrapper = await mountEditingActiveNetwork();
    callback.mockClear();

    await wrapper.find('[data-cy="btn-add-network"]').trigger('click');
    await flushPromises();
    unsubscribe();

    expect(activeNetwork.value.protocols.aeternity.middlewareUrl).toBe(NEW_MIDDLEWARE_URL);
    expect(callback).toHaveBeenCalledTimes(1);
    const [newNetwork, oldNetwork] = callback.mock.calls[0];
    expect(newNetwork.protocols.aeternity.middlewareUrl).toBe(NEW_MIDDLEWARE_URL);
    expect(oldNetwork.protocols.aeternity.middlewareUrl).toBe(OLD_MIDDLEWARE_URL);
  });
});
