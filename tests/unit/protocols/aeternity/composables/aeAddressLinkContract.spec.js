import { ref } from 'vue';

/**
 * `useAeAddressLinkContract` reads the preferred `.chain` name from the on-chain
 * AddressLink contract. The aeternity SDK (`Contract.initialize`), the network
 * boundary (`useAeSdk`/`useNetworks`) and the address config are mocked so the
 * tests assert the composable's own logic: network-type resolution, the
 * `get_link(addr, 'prefaens')` decode, and single/deduped contract init.
 *
 * `@/constants` is kept real (plain `NETWORK_TYPE_*` string constants) so the
 * mocked `AE_ADDRESS_LINK_CONTRACTS` keys line up with the resolved network type.
 */

const CONTRACTS = { mainnet: 'ct_main', testnet: 'ct_test' };
const PROVIDER = 'prefaens';

const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

async function loadComposable({
  networkType = 'testnet',
  getLinkResult = { decodedResult: 'name.chain' },
  network,
  contractInitialize: customInit,
} = {}) {
  vi.resetModules();

  const activeNetwork = network || ref({ type: networkType });
  const getContext = vi.fn(() => ({ ctx: true }));
  const getAeSdk = vi.fn().mockResolvedValue({ getContext });
  const getLink = vi.fn().mockResolvedValue(getLinkResult);
  const contractInitialize = customInit || vi.fn().mockImplementation(async ({ address }) => ({
    $options: { address },
    get_link: getLink,
  }));

  vi.doMock('@aeternity/aepp-sdk', () => ({
    Contract: { initialize: contractInitialize },
  }));
  vi.doMock('@/composables', () => ({
    useAeSdk: () => ({ getAeSdk }),
    useNetworks: () => ({ activeNetwork }),
  }));
  vi.doMock('@/protocols/aeternity/config', () => ({
    AE_ADDRESS_LINK_CONTRACTS: CONTRACTS,
    AE_ADDRESS_LINK_PREFERRED_NAME_PROVIDER: PROVIDER,
  }));

  const mod = await import('@/protocols/aeternity/composables/aeAddressLinkContract');
  return {
    composable: mod.useAeAddressLinkContract(),
    contractInitialize,
    getLink,
    getAeSdk,
    activeNetwork,
  };
}

describe('useAeAddressLinkContract', () => {
  it('resolves the preferred name via get_link(addr, prefaens)', async () => {
    const { composable, getLink } = await loadComposable();

    const name = await composable.getPreferredName('ak_test');

    expect(getLink).toHaveBeenCalledWith('ak_test', PROVIDER);
    expect(name).toBe('name.chain');
  });

  it('returns undefined when the account has no preferred name (None)', async () => {
    const { composable } = await loadComposable({ getLinkResult: { decodedResult: undefined } });

    expect(await composable.getPreferredName('ak_test')).toBeUndefined();
  });

  it('returns undefined without initializing when no contract is configured', async () => {
    const { composable, contractInitialize } = await loadComposable({ networkType: 'unconfigured' });

    expect(await composable.getPreferredName('ak_test')).toBeUndefined();
    expect(contractInitialize).not.toHaveBeenCalled();
  });

  it('resolves custom networks to the testnet deployment', async () => {
    const { composable } = await loadComposable({ networkType: 'custom' });

    expect(composable.addressLinkContractAddress.value).toBe(CONTRACTS.testnet);
  });

  it('initializes the contract only once for concurrent reads', async () => {
    const { composable, contractInitialize } = await loadComposable();

    await Promise.all([
      composable.getPreferredName('ak_a'),
      composable.getPreferredName('ak_b'),
      composable.getPreferredName('ak_c'),
    ]);

    expect(contractInitialize).toHaveBeenCalledTimes(1);
    expect(contractInitialize).toHaveBeenCalledWith(
      expect.objectContaining({ address: CONTRACTS.testnet }),
    );
  });

  it('reuses the cached contract instance across sequential reads', async () => {
    const { composable, contractInitialize } = await loadComposable();

    await composable.getPreferredName('ak_a');
    await composable.getPreferredName('ak_b');

    expect(contractInitialize).toHaveBeenCalledTimes(1);
  });

  it('does not return the previous network contract after a mid-init switch', async () => {
    // Hold each initialization open until its address is explicitly resolved.
    const resolvers = {};
    const contractInitialize = vi.fn(({ address }) => new Promise((resolve) => {
      resolvers[address] = () => resolve({ $options: { address }, get_link: vi.fn() });
    }));
    const activeNetwork = ref({ type: 'mainnet' });
    const { composable } = await loadComposable({ network: activeNetwork, contractInitialize });

    const mainnetContract = composable.getAddressLinkContract(); // targets ct_main
    activeNetwork.value = { type: 'testnet' }; // switch mid-init
    const testnetContract = composable.getAddressLinkContract(); // targets ct_test
    await flush();

    // A separate init was started per deployment; the switch didn't reuse the first.
    expect(contractInitialize).toHaveBeenCalledTimes(2);

    resolvers[CONTRACTS.mainnet]();
    resolvers[CONTRACTS.testnet]();
    const [c1, c2] = await Promise.all([mainnetContract, testnetContract]);

    expect(c1.$options.address).toBe(CONTRACTS.mainnet);
    expect(c2.$options.address).toBe(CONTRACTS.testnet);
  });
});
