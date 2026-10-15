import { ref } from 'vue';

const {
  adapter,
  checkOrAskPermission,
  switchNetwork,
} = vi.hoisted(() => {
  // The handler is already loaded by the global setup files; reload it with the mocks below.
  vi.resetModules();
  return {
    adapter: { fetchBalance: vi.fn(), transferPreparedTransaction: vi.fn() },
    checkOrAskPermission: vi.fn(),
    switchNetwork: vi.fn(),
  };
});

const SENDER = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
const RECIPIENT = '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2';
const ETH_NODE_URL = 'https://eth.node.example';
const AVALANCHE_NODE_URL = 'https://avalanche.node.example';

vi.mock('@/composables', () => ({
  usePermissions: () => ({
    checkPermission: () => true,
    checkOrAskPermission,
    removePermission: vi.fn(),
  }),
  useAccounts: () => ({
    activeAccount: ref({ protocol: 'ethereum', address: SENDER }),
    getLastActiveProtocolAccount: () => ({ protocol: 'ethereum', address: SENDER }),
  }),
  useNetworks: () => ({
    activeNetwork: ref({ name: 'Mainnet' }),
    networks: ref({
      Mainnet: {
        name: 'Mainnet',
        protocols: { ethereum: { chainId: '1' }, bnb: { chainId: '56' }, avalanche: { chainId: '43114' } },
      },
      Testnet: { name: 'Testnet', protocols: { ethereum: { chainId: '11155111' }, bnb: { chainId: '97' } } },
    }),
    switchNetwork,
  }),
}));
vi.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: { getAdapter: () => adapter },
}));
vi.mock('@/protocols/ethereum/composables/ethFeeCalculation', () => ({
  useEthFeeCalculation: () => ({ updateFeeList: vi.fn(), maxFeePerGas: ref(2e-8) }),
}));
vi.mock('@/protocols/ethereum/composables/ethNetworkSettings', () => ({
  useEthNetworkSettings: () => ({
    ethActiveNetworkSettings: ref({ chainId: '1', nodeUrl: ETH_NODE_URL }),
  }),
}));
vi.mock('@/protocols/avalanche/composables/avalancheNetworkSettings', () => ({
  useAvalancheNetworkSettings: () => ({
    avalancheActiveNetworkSettings: ref({ chainId: '43114', nodeUrl: AVALANCHE_NODE_URL }),
  }),
}));
vi.mock('@/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: ref({ chainId: '56', nodeUrl: 'https://bnb.node.example' }),
  }),
}));

const { handleEvmRpcMethod, handleEvmRpcRequest } = await import('@/protocols/evm/libs/EvmRpcMethodsHandler');

const DAPP = 'https://dapp.example';

/** Answers JSON-RPC requests like a node would, by method. */
function mockNode(responses: Record<string, object>) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const { method } = JSON.parse(init.body as string);
    return { status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, ...responses[method] }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function getNodeRequests(fetchMock: ReturnType<typeof mockNode>) {
  return fetchMock.mock.calls.map(([url, init]) => ({ url, ...JSON.parse(init.body as string) }));
}

describe('handleEvmRpcMethod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkOrAskPermission.mockResolvedValue(true);
    adapter.transferPreparedTransaction.mockResolvedValue({ hash: '0xhash' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('eth_getBalance', () => {
    it.each([
      ['2', '0x1bc16d674ec80000'],
      ['1.5', '0x14d1120d7b160000'],
      ['0', '0x0'],
    ])('returns %s ETH as hex wei', async (balance, expected) => {
      adapter.fetchBalance.mockResolvedValue(balance);
      const response = await handleEvmRpcMethod(DAPP, 'eth_getBalance', { address: SENDER });
      expect(response).toEqual({ result: expected });
    });
  });

  describe('eth_sendTransaction', () => {
    const tx = { from: SENDER, to: RECIPIENT, value: '0xde0b6b3a7640000' };

    it('sends with the node gas estimate plus headroom', async () => {
      const fetchMock = mockNode({ eth_estimateGas: { result: '0x5208' } });
      const response = await handleEvmRpcMethod(DAPP, 'eth_sendTransaction', tx);

      expect(response).toEqual({ result: '0xhash' });
      expect(getNodeRequests(fetchMock)).toMatchObject([{ method: 'eth_estimateGas', params: [tx] }]);
      expect(checkOrAskPermission.mock.calls[0][2].tx.gas).toBe(24150);
      expect(adapter.transferPreparedTransaction).toHaveBeenCalledWith({ ...tx, gas: '0x5e56' });
    });

    it('estimates on the node of the requested chain and shows its coin', async () => {
      const fetchMock = mockNode({ eth_estimateGas: { result: '0x5208' } });
      await handleEvmRpcMethod(DAPP, 'eth_sendTransaction', tx, 'Dapp', 'eip155:43114');

      expect(getNodeRequests(fetchMock)).toMatchObject([{ url: AVALANCHE_NODE_URL }]);
      expect(checkOrAskPermission.mock.calls[0][2]).toMatchObject({
        protocol: 'avalanche', tx: { contractId: 'avalanche' },
      });
    });

    it('keeps the gas set by the dapp', async () => {
      const fetchMock = mockNode({});
      await handleEvmRpcMethod(DAPP, 'eth_sendTransaction', { ...tx, gas: '0x7530' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(adapter.transferPreparedTransaction).toHaveBeenCalledWith({ ...tx, gas: '0x7530' });
    });

    it('returns the estimation error without asking to sign', async () => {
      const error = { code: 3, message: 'execution reverted', data: '0x08c379a0' };
      mockNode({ eth_estimateGas: { error } });
      const response = await handleEvmRpcMethod(DAPP, 'eth_sendTransaction', tx);

      expect(response).toEqual({ error });
      expect(checkOrAskPermission).not.toHaveBeenCalled();
      expect(adapter.transferPreparedTransaction).not.toHaveBeenCalled();
    });
  });

  describe('wallet_switchEthereumChain', () => {
    it.each([
      ['0xaa36a7', 'Testnet'],
      ['11155111', 'Testnet'],
      ['0x38', 'Mainnet'],
    ])('switches to the network of chain %s', async (chainId, networkName) => {
      expect(await handleEvmRpcMethod(DAPP, 'wallet_switchEthereumChain', { chainId }))
        .toEqual({ result: null });
      expect(switchNetwork).toHaveBeenCalledWith(networkName);
    });

    it('rejects an unknown chain', async () => {
      const response = await handleEvmRpcMethod(DAPP, 'wallet_switchEthereumChain', { chainId: '0x2a' });
      expect(response.error?.code).toBe(4902);
      expect(switchNetwork).not.toHaveBeenCalled();
    });
  });
});

describe('handleEvmRpcRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes a request that reads the chain to its node as is', async () => {
    const call = [{ to: RECIPIENT, data: '0x70a08231' }, 'latest'];
    const fetchMock = mockNode({ eth_call: { result: '0x01' } });

    expect(await handleEvmRpcRequest(DAPP, 'eth_call', call)).toEqual({ result: '0x01' });
    expect(getNodeRequests(fetchMock)).toEqual([{
      url: ETH_NODE_URL, jsonrpc: '2.0', id: 1, method: 'eth_call', params: call,
    }]);
  });

  it.each([
    ['eth_blockNumber', []],
    ['eth_getTransactionCount', [SENDER, 'pending']],
    ['eth_getCode', [RECIPIENT, 'latest']],
    ['eth_feeHistory', ['0x5', 'latest', [25, 75]]],
    ['eth_sendRawTransaction', ['0x02f8']],
    ['net_version', []],
  ])('passes %s to the node', async (method, params) => {
    const fetchMock = mockNode({ [method]: { result: '0x01' } });
    expect(await handleEvmRpcRequest(DAPP, method, params)).toEqual({ result: '0x01' });
    expect(getNodeRequests(fetchMock)).toMatchObject([{ method, params }]);
  });

  it('asks the node of the chain the request is for', async () => {
    const fetchMock = mockNode({ eth_call: { result: '0x01' } });
    await handleEvmRpcRequest(DAPP, 'eth_call', [], 'Dapp', 'eip155:56');
    expect(getNodeRequests(fetchMock)).toMatchObject([{ url: 'https://bnb.node.example' }]);
  });

  it('answers the methods of the wallet by itself', async () => {
    adapter.fetchBalance.mockResolvedValue('1');
    const fetchMock = mockNode({});

    expect(await handleEvmRpcRequest(DAPP, 'eth_getBalance', [SENDER, 'latest']))
      .toEqual({ result: '0xde0b6b3a7640000' });
    expect(adapter.fetchBalance).toHaveBeenCalledWith(SENDER);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps other methods off the node', async () => {
    const fetchMock = mockNode({});
    expect((await handleEvmRpcRequest(DAPP, 'eth_sign', [SENDER, '0x01'])).error?.code).toBe(-32004);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers null for a transaction the node does not know yet', async () => {
    mockNode({ eth_getTransactionReceipt: { result: null } });
    expect(await handleEvmRpcRequest(DAPP, 'eth_getTransactionReceipt', ['0x01'])).toEqual({ result: null });
  });

  it('returns the node error', async () => {
    const error = { code: -32000, message: 'header not found' };
    mockNode({ eth_call: { error } });
    expect(await handleEvmRpcRequest(DAPP, 'eth_call', [])).toEqual({ error });
  });

  it('reports an unreachable node as an internal error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));
    expect(await handleEvmRpcRequest(DAPP, 'eth_call', []))
      .toEqual({ error: { code: -32603, message: 'Failed to fetch' } });
  });

  it('answers a request it fails to handle with an internal error', async () => {
    const tx = { from: 'nope', to: RECIPIENT, gas: '0x5208' };
    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [tx]);

    expect(response.error?.code).toBe(-32603);
    expect(adapter.transferPreparedTransaction).not.toHaveBeenCalled();
  });
});
