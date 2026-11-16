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

function createProtocols() {
  const { networks } = useNetworks();
  const protocols = cloneDeep(networks.value.Testnet.protocols);
  // The form requires an explorer for every protocol
  Object.keys(protocols).forEach((protocol) => {
    protocols[protocol] = { explorerUrl: 'https://explorer.example', ...protocols[protocol] };
  });
  protocols.aeternity.middlewareUrl = OLD_MIDDLEWARE_URL;
  return protocols;
}

/** Edits "Custom A", saved between the networks named before and after it. */
async function mountEditing({ before = [], after = [], isActive = true } = {}) {
  const { addCustomNetwork, switchNetwork } = useNetworks();
  [...before, 'Custom A', ...after].forEach((name) => {
    addCustomNetwork({ name, type: 'custom', protocols: createProtocols() });
  });
  if (isActive) switchNetwork('Custom A');

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
    const wrapper = await mountEditing();

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
    const wrapper = await mountEditing();
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

  it('saves the edited network after another window removed an earlier one', async () => {
    const wrapper = await mountEditing({ before: ['Earlier'], after: ['Later'], isActive: false });
    const { customNetworks, networks } = useNetworks();
    customNetworks.value.splice(0, 1);

    await wrapper.find('[data-cy="btn-add-network"]').trigger('click');
    await flushPromises();

    expect(customNetworks.value.map(({ name }) => name)).toEqual(['Custom A', 'Later']);
    expect(networks.value['Custom A'].protocols.aeternity.middlewareUrl).toBe(NEW_MIDDLEWARE_URL);
    expect(networks.value.Later.protocols.aeternity.middlewareUrl).toBe(OLD_MIDDLEWARE_URL);
  });

  it('goes back without saving when another window removed the edited network', async () => {
    const wrapper = await mountEditing({ before: ['Earlier'], after: ['Later'], isActive: false });
    const { customNetworks, networks, activeNetworkName } = useNetworks();
    customNetworks.value.splice(1, 1);

    await wrapper.find('[data-cy="btn-add-network"]').trigger('click');
    await flushPromises();

    expect(router.replace).toHaveBeenCalled();
    expect(customNetworks.value.map(({ name }) => name)).toEqual(['Earlier', 'Later']);
    expect(networks.value.Later.protocols.aeternity.middlewareUrl).toBe(OLD_MIDDLEWARE_URL);
    expect(activeNetworkName.value).toBe('Mainnet');
  });
});
