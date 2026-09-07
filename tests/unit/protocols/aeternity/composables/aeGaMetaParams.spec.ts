// @ts-nocheck

/**
 * `useAeGaMetaParams` prices the `GaMetaTx` that wraps a multisig transaction. Both values end up
 * in the authentication hash a proposal is stored under, so what matters here is that they are
 * derived from the network rather than from the moment: every signer has to arrive at the same
 * numbers, days apart and on another device.
 *
 * The SDK is only partially mocked - `getCachedProtocolParameters` stands in for the node request,
 * while `defaultProtocolParameters` stays real so the fallback values are the ones production uses.
 */
let getCachedProtocolParametersMock;
let onNetworkChangeMock;
let apiStub;

const AETTOS_PER_GAS_DEFAULT = '1000000000'; // minimum gas price of the SDK release

// What a node reports: the consensus minimum and the one its miner is configured with. Public
// networks run the second a thousand times above the first, and only the second gets mined.
const parameters = (minGasPrice, minMinerGasPrice = minGasPrice) => ({
  minGasPrice: BigInt(minGasPrice),
  minMinerGasPrice: BigInt(minMinerGasPrice),
});

async function loadComposable() {
  const { useAeGaMetaParams } = await import('@/protocols/aeternity/composables/aeGaMetaParams');
  return useAeGaMetaParams();
}

describe('useAeGaMetaParams', () => {
  beforeEach(async () => {
    vi.resetModules();

    apiStub = { name: 'node-stub' };
    onNetworkChangeMock = vi.fn();
    getCachedProtocolParametersMock = vi.fn(async () => parameters(AETTOS_PER_GAS_DEFAULT));

    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({ getAeSdk: async () => ({ api: apiStub }) }),
    }));
    vi.doMock('@/composables/networks', () => ({
      useNetworks: () => ({ onNetworkChange: onNetworkChangeMock }),
    }));
    vi.doMock('@aeternity/aepp-sdk', async (importOriginal) => ({
      ...(await importOriginal()),
      getCachedProtocolParameters: getCachedProtocolParametersMock,
    }));
  });

  it('prices the meta transaction by the minimum gas price the node reports', async () => {
    getCachedProtocolParametersMock.mockResolvedValue(parameters('5000000000'));

    const { getGaMetaParams } = await loadComposable();

    expect(await getGaMetaParams()).toEqual({
      gasPrice: '5000000000',
      fee: '500000000000000', // 5e9 * 1e5 gas
    });
    expect(getCachedProtocolParametersMock).toHaveBeenCalledWith(apiStub);
  });

  it('keeps the historical values on a network running the default minimum', async () => {
    const { getGaMetaParams } = await loadComposable();

    expect(await getGaMetaParams()).toEqual({
      gasPrice: AETTOS_PER_GAS_DEFAULT,
      fee: '100000000000000', // the 1e14 aettos the wallet has always used
    });
  });

  // mainnet and testnet: a consensus minimum of 1e6 under a miner minimum of 1e9. A meta
  // transaction priced at the consensus minimum is refused by the node's pool as too cheap for its
  // miner, so it can never be sent - the price has to be the one the network actually mines at
  it('prices by the miner minimum where that is above the consensus one', async () => {
    getCachedProtocolParametersMock.mockResolvedValue(parameters('1000000', '1000000000'));

    const { getGaMetaParams } = await loadComposable();

    expect(await getGaMetaParams()).toEqual({
      gasPrice: '1000000000',
      fee: '100000000000000',
    });
  });

  it('prices by the consensus minimum where the miner one is below it', async () => {
    getCachedProtocolParametersMock.mockResolvedValue(parameters('2000000000', '1000000000'));

    const { getGaMetaParams } = await loadComposable();

    expect(await getGaMetaParams()).toEqual({
      gasPrice: '2000000000',
      fee: '200000000000000',
    });
  });

  it('exposes the values of the SDK release before the node has answered', async () => {
    let resolveParameters;
    getCachedProtocolParametersMock.mockReturnValue(
      new Promise((resolve) => { resolveParameters = resolve; }),
    );

    const { gaMetaParams, getGaMetaParams } = await loadComposable();

    expect(gaMetaParams.value).toEqual({
      gasPrice: AETTOS_PER_GAS_DEFAULT,
      fee: '100000000000000',
    });

    const pending = getGaMetaParams();
    resolveParameters(parameters('7000000000'));
    await pending;

    expect(gaMetaParams.value).toEqual({
      gasPrice: '7000000000',
      fee: '700000000000000',
    });
  });

  it('gives the proposal and the transaction sent later the same values', async () => {
    getCachedProtocolParametersMock.mockResolvedValue(parameters('3000000000'));

    const { getGaMetaParams } = await loadComposable();

    // `proposeTx` hashes these into the proposal, `sendTx` has to reproduce them exactly
    expect(await getGaMetaParams()).toEqual(await getGaMetaParams());
  });

  it('drops the values of the network the user left', async () => {
    getCachedProtocolParametersMock.mockResolvedValue(parameters('5000000000'));

    const { gaMetaParams, getGaMetaParams } = await loadComposable();
    await getGaMetaParams();
    expect(gaMetaParams.value.gasPrice).toBe('5000000000');

    getCachedProtocolParametersMock.mockResolvedValue(parameters(AETTOS_PER_GAS_DEFAULT));
    const [onNetworkChangeCallback] = onNetworkChangeMock.mock.calls[0];
    onNetworkChangeCallback();

    // Reset synchronously, so nothing built in between is priced by the previous network
    expect(gaMetaParams.value.gasPrice).toBe(AETTOS_PER_GAS_DEFAULT);

    await vi.waitFor(() => expect(getCachedProtocolParametersMock).toHaveBeenCalledTimes(3));
    expect(gaMetaParams.value.fee).toBe('100000000000000');
  });
});
