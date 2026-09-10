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

  it('initializes with the default Mainnet/Testnet networks and switches to Mainnet', async () => {
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
