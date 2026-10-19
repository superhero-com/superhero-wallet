// @ts-nocheck
/**
 * `useNetworks` is exercised almost end-to-end here: `useStorageRef` runs against the
 * real jsdom `localStorage` and `ProtocolAdapterFactory` uses the real protocol adapters
 * (registered via the `registerAdapters` setup file). The only thing mocked is
 * `useModals`, since `deleteCustomNetwork` depends on a user confirming a modal.
 *
 * Every composable under test keeps state at module scope, so each test re-imports it
 * fresh (`vi.resetModules()`) after clearing `localStorage`, and re-registers the real
 * protocol adapters (registerAdapters.ts is normally loaded once, globally, before any
 * reset).
 */
const flushAsync = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const openConfirmModalMock = vi.fn();

describe('useNetworks', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    openConfirmModalMock.mockReset();

    // Must be registered before `registerAdapters` is imported: it transitively loads
    // the real `modals` composable (via aeSdk.ts -> accounts.ts -> the `@/composables`
    // barrel), so mocking it afterwards would be too late for this module generation.
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({ openConfirmModal: openConfirmModalMock }),
    }));

    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts on Mainnet with the default Mainnet and Testnet networks', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const { networks, activeNetwork, activeNetworkName } = useNetworks();
    await flushAsync();

    expect(Object.keys(networks.value)).toEqual(['Mainnet', 'Testnet']);
    expect(activeNetworkName.value).toBe('Mainnet');
    expect(activeNetwork.value.type).toBe('mainnet');
    expect(activeNetwork.value.protocols.aeternity).toBeTruthy();
  });

  it('switches network and notifies onNetworkChange callbacks with old/new network', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const { switchNetwork, onNetworkChange, activeNetwork } = useNetworks();
    await flushAsync();

    const callback = vi.fn();
    onNetworkChange(callback);

    switchNetwork('Testnet');

    expect(activeNetwork.value.name).toBe('Testnet');
    expect(callback).toHaveBeenCalledTimes(1);
    const [newNetwork, oldNetwork] = callback.mock.calls[0];
    expect(newNetwork.name).toBe('Testnet');
    expect(oldNetwork.name).toBe('Mainnet');
  });

  it('throws when switching to a network that does not exist', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const { switchNetwork } = useNetworks();
    await flushAsync();

    expect(() => switchNetwork('DoesNotExist')).toThrow(
      'Could not switch to "DoesNotExist" network as it does not exist',
    );
  });

  it('adds a custom network and updates it by index, rejecting out-of-range indexes', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const {
      addCustomNetwork, updateCustomNetwork, customNetworks, networks,
    } = useNetworks();
    await flushAsync();

    const customNetwork = { name: 'My Custom', type: 'testnet', protocols: {} };
    addCustomNetwork(customNetwork);

    expect(customNetworks.value).toHaveLength(1);
    expect(networks.value['My Custom']).toEqual(customNetwork);

    const updated = { ...customNetwork, type: 'mainnet' };
    expect(updateCustomNetwork(0, updated)).toBe(true);
    expect(customNetworks.value[0]).toEqual(updated);

    expect(updateCustomNetwork(5, updated)).toBe(false);
  });

  it('deletes a custom network on confirmation, switching to Mainnet first if it was active', async () => {
    openConfirmModalMock.mockResolvedValue(undefined);

    const { useNetworks } = await import('@/composables/networks');
    const {
      addCustomNetwork,
      switchNetwork,
      deleteCustomNetwork,
      onNetworkRemoved,
      customNetworks,
      activeNetworkName,
    } = useNetworks();
    await flushAsync();

    const customNetwork = { name: 'My Custom', type: 'testnet', protocols: {} };
    addCustomNetwork(customNetwork);
    switchNetwork('My Custom');

    const removedCallback = vi.fn();
    onNetworkRemoved(removedCallback);

    const result = await deleteCustomNetwork('My Custom');

    expect(result).toBe(true);
    expect(customNetworks.value).toHaveLength(0);
    expect(activeNetworkName.value).toBe('Mainnet');
    expect(removedCallback).toHaveBeenCalledWith(customNetwork);
  });

  it('renaming the active custom network keeps it active and notifies with the previous one', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const {
      addCustomNetwork, updateCustomNetwork, switchNetwork, onNetworkChange, activeNetwork,
      activeNetworkName,
    } = useNetworks();
    await flushAsync();

    const custom = { name: 'Custom A', type: 'custom', protocols: {} };
    addCustomNetwork(custom);
    switchNetwork('Custom A');

    const seen = [];
    onNetworkChange((n, o) => { seen.push(['first', n.name, o.name]); });
    // Same check as latestTransactionList and aeTokenSales
    onNetworkChange((n, o) => { if (n.name !== o.name) seen.push(['second']); });
    onNetworkChange((n, o) => { seen.push(['third', n.name, o.name]); });

    // NetworkForm edit flow with a new name
    expect(updateCustomNetwork(0, { ...custom, name: 'Custom B' })).toBe(true);

    expect(activeNetworkName.value).toBe('Custom B');
    expect(activeNetwork.value.name).toBe('Custom B');
    expect(seen).toEqual([
      ['first', 'Custom B', 'Custom A'],
      ['second'],
      ['third', 'Custom B', 'Custom A'],
    ]);
  });

  it('editing the active network passes its previous settings as the old network', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const {
      addCustomNetwork, updateCustomNetwork, switchNetwork, onNetworkChange,
    } = useNetworks();
    await flushAsync();

    const custom = {
      name: 'Custom A',
      type: 'custom',
      protocols: { aeternity: { middlewareUrl: 'https://old.example' } },
    };
    addCustomNetwork(custom);
    switchNetwork('Custom A');

    const callback = vi.fn();
    onNetworkChange(callback);

    updateCustomNetwork(0, {
      ...custom,
      protocols: { aeternity: { middlewareUrl: 'https://new.example' } },
    });

    expect(callback).toHaveBeenCalledTimes(1);
    const [newNetwork, oldNetwork] = callback.mock.calls[0];
    expect(newNetwork.protocols.aeternity.middlewareUrl).toBe('https://new.example');
    expect(oldNetwork.protocols.aeternity.middlewareUrl).toBe('https://old.example');
  });

  it('editing an inactive custom network does not notify', async () => {
    const { useNetworks } = await import('@/composables/networks');
    const {
      addCustomNetwork, updateCustomNetwork, onNetworkChange, activeNetworkName,
    } = useNetworks();
    await flushAsync();

    const custom = { name: 'Custom A', type: 'custom', protocols: {} };
    addCustomNetwork(custom);

    const callback = vi.fn();
    onNetworkChange(callback);

    updateCustomNetwork(0, { ...custom, name: 'Custom B' });

    expect(callback).not.toHaveBeenCalled();
    expect(activeNetworkName.value).toBe('Mainnet');
  });

  it('a throwing onNetworkChange callback does not stop the others', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { useNetworks } = await import('@/composables/networks');
    const { switchNetwork, onNetworkChange } = useNetworks();
    await flushAsync();

    const error = new Error('subscriber failed');
    onNetworkChange(() => { throw error; });
    const callback = vi.fn();
    onNetworkChange(callback);

    expect(() => switchNetwork('Testnet')).not.toThrow();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('Unknown rejection', error);
  });

  it('keeps the network when the user rejects the confirmation modal', async () => {
    openConfirmModalMock.mockRejectedValue(new Error('cancelled by user'));

    const { useNetworks } = await import('@/composables/networks');
    const { addCustomNetwork, deleteCustomNetwork, customNetworks } = useNetworks();
    await flushAsync();

    addCustomNetwork({ name: 'My Custom', type: 'testnet', protocols: {} });

    const result = await deleteCustomNetwork('My Custom');

    expect(result).toBe(false);
    expect(customNetworks.value).toHaveLength(1);
  });
});

describe('useNetworks restoring the active network', () => {
  async function restoreWith(stored: Record<string, any>) {
    vi.resetModules();
    localStorage.clear();
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({ openConfirmModal: vi.fn() }),
    }));
    // Seed before registerAdapters: it loads networks.ts, which restores on evaluation
    const { WalletStorage } = await import('@/lib/WalletStorage');
    Object.entries(stored).forEach(([key, value]) => WalletStorage.set(key, value));
    // Hold the stored values back until `useNetworks` has run, as at app start
    let releaseStorage;
    const storageGate = new Promise((resolve) => { releaseStorage = resolve; });
    const { get } = WalletStorage;
    const getSpy = vi.spyOn(WalletStorage, 'get').mockImplementation(
      (key) => (key in stored ? storageGate.then(() => get(key)) : get(key)),
    );
    await import('@/protocols/registerAdapters');
    const { useNetworks } = await import('@/composables/networks');
    const result = useNetworks();
    releaseStorage();
    await flushAsync();
    getSpy.mockRestore();
    return { ...result, WalletStorage };
  }

  it('falls back to Mainnet when the stored active network no longer exists', async () => {
    const {
      activeNetwork, activeNetworkName, isActiveNetworkTestnet, WalletStorage,
    } = await restoreWith({ 'active-network-name': 'Deleted network' });

    expect(activeNetwork.value.name).toBe('Mainnet');
    expect(isActiveNetworkTestnet.value).toBe(false);
    expect(activeNetworkName.value).toBe('Mainnet');
    expect(WalletStorage.get('active-network-name')).toBe('Mainnet');
  });

  it('keeps a stored custom active network', async () => {
    const { activeNetwork, activeNetworkName } = await restoreWith({
      'custom-networks': [{ name: 'Custom A', type: 'custom', protocols: {} }],
      'active-network-name': 'Custom A',
    });

    expect(activeNetworkName.value).toBe('Custom A');
    expect(activeNetwork.value.name).toBe('Custom A');
  });

  it('reads Mainnet while a synced active name has no network yet', async () => {
    const { activeNetwork, activeNetworkName } = await restoreWith({});

    // Another context switched to a network whose settings have not synced yet
    activeNetworkName.value = 'Not synced yet';

    expect(activeNetwork.value.name).toBe('Mainnet');
  });

  it('keeps a stored Testnet', async () => {
    const { activeNetwork } = await restoreWith({ 'active-network-name': 'Testnet' });

    expect(activeNetwork.value.name).toBe('Testnet');
  });
});
