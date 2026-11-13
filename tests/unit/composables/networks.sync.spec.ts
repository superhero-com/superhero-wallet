import type { INetwork, StorageKey } from '@/types';
import { NETWORK_TYPE_CUSTOM, STORAGE_KEYS } from '@/constants';
import { composeStorageKeys } from '@/utils';

describe('network synchronization between wallet contexts', () => {
  let state: ReturnType<typeof import('@/composables/networks')['useNetworks']>;
  let storage: typeof import('@/lib/WalletStorage')['WalletStorage'];
  let storageListeners: EventListenerOrEventListenerObject[];

  function emitStorage(key: StorageKey) {
    window.dispatchEvent(new StorageEvent('storage', {
      key: composeStorageKeys(key),
      storageArea: localStorage,
      newValue: localStorage.getItem(composeStorageKeys(key)),
    }));
  }

  function customNetwork(): INetwork {
    const mainnet = state.networks.value.Mainnet;
    return {
      ...mainnet,
      name: 'Hyperchain',
      type: NETWORK_TYPE_CUSTOM,
      protocols: {
        ...mainnet.protocols,
        aeternity: {
          ...mainnet.protocols.aeternity,
          nodeUrl: 'https://hyperchain.example',
        },
      },
    };
  }

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({ openConfirmModal: vi.fn() }),
    }));
    await import('@/protocols/registerAdapters');
    ({ WalletStorage: storage } = await import('@/lib/WalletStorage'));
    const { useNetworks } = await import('@/composables/networks');
    state = useNetworks();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    storageListeners = addEventListener.mock.calls
      .filter(([event]) => event === 'storage')
      .map(([, listener]) => listener);
  });

  afterEach(() => {
    storageListeners.forEach((listener) => window.removeEventListener('storage', listener));
    vi.doUnmock('@/composables/modals');
    vi.restoreAllMocks();
  });

  it('updates all consumers and notifies subscribers once after a remote switch', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const otherConsumer = useNetworks();
    useNetworks();
    const changed = vi.fn();
    state.onNetworkChange(changed);
    storage.set(STORAGE_KEYS.activeNetworkName, 'Testnet');

    emitStorage(STORAGE_KEYS.activeNetworkName);

    expect(state.activeNetworkName.value).toBe('Testnet');
    expect(otherConsumer.activeNetworkName.value).toBe('Testnet');
    expect(state.activeNetwork.value).toBe(state.networks.value.Testnet);
    expect(changed).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledWith(
      state.networks.value.Testnet,
      state.networks.value.Mainnet,
    );
  });

  it.each([STORAGE_KEYS.customNetworks, STORAGE_KEYS.activeNetworkName])(
    'reads the new custom network and active name together on the %s event',
    (firstKey) => {
      const changed = vi.fn();
      state.onNetworkChange(changed);
      const custom = customNetwork();
      storage.set(STORAGE_KEYS.customNetworks, [custom]);
      storage.set(STORAGE_KEYS.activeNetworkName, custom.name);

      emitStorage(firstKey);

      expect(state.activeNetwork.value).toEqual(custom);
      expect(state.activeNetworkName.value).toBe(custom.name);
      expect(changed).toHaveBeenCalledOnce();
      expect(changed).toHaveBeenCalledWith(custom, state.networks.value.Mainnet);

      emitStorage(STORAGE_KEYS.customNetworks);
      emitStorage(STORAGE_KEYS.activeNetworkName);

      expect(changed).toHaveBeenCalledOnce();
    },
  );

  it('notifies subscribers when a remote edit changes the active custom node URL', async () => {
    const original = customNetwork();
    state.addCustomNetwork(original);
    state.switchNetwork(original.name);
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    const changed = vi.fn();
    state.onNetworkChange(changed);
    const edited = {
      ...original,
      protocols: {
        ...original.protocols,
        aeternity: { ...original.protocols.aeternity, nodeUrl: 'https://new-node.example' },
      },
    };
    storage.set(STORAGE_KEYS.customNetworks, [edited]);

    emitStorage(STORAGE_KEYS.customNetworks);

    expect(state.activeNetwork.value.protocols.aeternity.nodeUrl).toBe('https://new-node.example');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledWith(edited, original);
  });

  it('ignores irrelevant events, unchanged values, and edits of an inactive custom network', () => {
    const changed = vi.fn();
    state.onNetworkChange(changed);
    const custom = customNetwork();
    storage.set(STORAGE_KEYS.customNetworks, [custom]);
    storage.set(STORAGE_KEYS.activeNetworkName, 'Mainnet');

    emitStorage(STORAGE_KEYS.permissions);
    expect(state.customNetworks.value).toEqual([]);

    emitStorage(STORAGE_KEYS.customNetworks);
    emitStorage(STORAGE_KEYS.customNetworks);
    emitStorage(STORAGE_KEYS.activeNetworkName);

    expect(state.customNetworks.value).toEqual([custom]);
    expect(state.activeNetworkName.value).toBe('Mainnet');
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps local switch callbacks synchronous without repeating them for the same saved state', async () => {
    const changed = vi.fn();
    state.onNetworkChange(changed);

    state.switchNetwork('Testnet');
    expect(changed).toHaveBeenCalledOnce();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    emitStorage(STORAGE_KEYS.activeNetworkName);

    expect(changed).toHaveBeenCalledOnce();
  });
});
