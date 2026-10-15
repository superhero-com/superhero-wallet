import { ref } from 'vue';
import { METHODS } from '@aeternity/aepp-sdk';
import type { AppOriginSource } from '@/types';

const {
  activeProtocol,
  adapter,
  checkOrAskPermission,
  switchNetwork,
} = vi.hoisted(() => {
  // The handler is already loaded by the global setup files; reload it with the mocks below.
  vi.resetModules();
  return {
    activeProtocol: { value: 'ethereum' },
    adapter: { fetchBalance: vi.fn(), transferPreparedTransaction: vi.fn() },
    checkOrAskPermission: vi.fn(),
    switchNetwork: vi.fn(),
  };
});

const SENDER = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
const RECIPIENT = '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2';
const ETH_NODE_URL = 'https://eth.node.example';
const AVALANCHE_NODE_URL = 'https://avalanche.node.example';
/** The active account, holds keccak256('cow') */
const SIGNER = {
  protocol: 'ethereum',
  address: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
  secretKey: Buffer.from('c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4', 'hex'),
};
/** Another account of the wallet, holds keccak256('dog') */
const OTHER = {
  protocol: 'ethereum',
  address: '0x252487948306535425542FCFE52008d32d1Fd9fb',
  secretKey: Buffer.from('41791102999c339c844880b23950704cc43aa840f3739e365323cda4dfa89e7a', 'hex'),
};

vi.mock('@/composables', () => {
  // Connecting without "remember me" still leaves an entry
  const permissions = ref<Record<string, object>>({
    'dapp.example': { host: 'dapp.example', address: true },
    'unremembered.example': { host: 'unremembered.example', address: false },
  });
  return {
    usePermissions: () => ({
      checkPermission: () => true,
      checkOrAskPermission,
      removePermission: (host: string) => { delete permissions.value[host]; },
      permissions,
    }),
    useAccounts: () => ({
      activeAccount: ref({ protocol: activeProtocol.value, address: SIGNER.address }),
      getLastActiveProtocolAccount: (protocol: string) => ({ ...SIGNER, protocol }),
      getAccountByProtocolAndAddress: (protocol: string, address: string) => {
        const account = [SIGNER, OTHER].find((acc) => acc.address === address);
        return account && { ...account, protocol };
      },
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
  };
});
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
const { usePermissions } = await import('@/composables');

const DAPP = 'https://dapp.example';
/** Never connected */
const STRANGER = 'https://stranger.example';
const UNAUTHORIZED = {
  error: { code: 4100, message: 'The requested account and/or method has not been authorized by the user' },
};

const permit = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  },
  domain: { name: 'Permit2', chainId: '1', verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3' },
  primaryType: 'PermitSingle',
  message: {
    details: {
      token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      amount: '1461501637330902918203684832716283019655932542975',
      expiration: '1731600000',
      nonce: '0',
    },
    spender: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
    sigDeadline: '1729010000',
  },
};
/** By `@metamask/eth-sig-util` signTypedData V4 */
const PERMIT_SIGNATURE = '0x44414d7daf8c2701848542c05cda9536967774916d171d420c73315cbf9822b13ba5129075dd4fa2fb2f85f127b0da3da72bec974114093affbf95f6c217d1961c';

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

  describe('eth_signTypedData_v4', () => {
    function signTypedData(typedData: object, address = SIGNER.address.toLowerCase()) {
      return handleEvmRpcMethod(DAPP, 'eth_signTypedData_v4', { address, data: JSON.stringify(typedData) });
    }

    it('signs with the requested account once the user confirms', async () => {
      expect(await signTypedData(permit)).toEqual({ result: PERMIT_SIGNATURE });

      const [method, url, modalProps] = checkOrAskPermission.mock.calls[0];
      expect([method, url]).toEqual([METHODS.signTypedData, DAPP]);
      expect(modalProps).toMatchObject({ protocol: 'ethereum', fromAccount: SIGNER.address });
      expect(JSON.parse(modalProps.message)).toEqual({
        primaryType: permit.primaryType, domain: permit.domain, message: permit.message,
      });
    });

    it('signs typed data for the chain of the request', async () => {
      const response = await handleEvmRpcMethod(DAPP, 'eth_signTypedData_v4', {
        address: SIGNER.address,
        data: JSON.stringify({ ...permit, domain: { ...permit.domain, chainId: 43114 } }),
      }, 'Dapp', 'eip155:43114');

      expect(response).toEqual({
        result: '0xc42a03e2ef55af316ba49e9603cfbae56efc828d9a841a538a4e84a086cfa81d3cfbca6c1704cb7803718a2fc4dc220e07748e44d5e4624ad0f174a03d4c85381b',
      });
      expect(checkOrAskPermission.mock.calls[0][2].protocol).toBe('avalanche');
    });

    it('accepts the chainId of the domain in hex', async () => {
      expect(await signTypedData({ ...permit, domain: { ...permit.domain, chainId: '0x1' } }))
        .toEqual({ result: PERMIT_SIGNATURE });
    });

    it('shows only what gets signed', async () => {
      const response = await signTypedData({
        ...permit,
        domain: { ...permit.domain, version: '1' },
        message: {
          ...permit.message,
          memo: 'Allows 10 USDC',
          details: { ...permit.message.details, note: 'Safe' },
        },
      });

      expect(response).toEqual({ result: PERMIT_SIGNATURE });
      expect(JSON.parse(checkOrAskPermission.mock.calls[0][2].message)).toEqual({
        primaryType: permit.primaryType, domain: permit.domain, message: permit.message,
      });
    });

    it.each([
      ['an account it holds', SIGNER.address],
      ['an account it does not hold', SENDER],
    ])('gives a site that is not connected one answer for %s', async (_, address) => {
      const response = await handleEvmRpcMethod(STRANGER, 'eth_signTypedData_v4', {
        address, data: JSON.stringify(permit),
      });

      expect(response).toEqual(UNAUTHORIZED);
      expect(checkOrAskPermission).not.toHaveBeenCalled();
    });

    it.each([
      ['connected without being remembered', 'https://unremembered.example', undefined],
      ['of a WalletConnect session, which keeps no permission', STRANGER, 'self-reported'],
    ])('signs for a site %s', async (_, aepp, originSource) => {
      const response = await handleEvmRpcMethod(aepp, 'eth_signTypedData_v4', {
        address: SIGNER.address, data: JSON.stringify(permit),
      }, 'Dapp', undefined, originSource as AppOriginSource | undefined);

      expect(response).toEqual({ result: PERMIT_SIGNATURE });
    });

    it('signs with any account of a WalletConnect session', async () => {
      const response = await handleEvmRpcMethod(STRANGER, 'eth_signTypedData_v4', {
        address: OTHER.address, data: JSON.stringify(permit),
      }, 'Dapp', undefined, 'self-reported');

      expect(response).toEqual({
        result: '0xffd054da9f926e78924e16dd376686ec50f1be6d228ae6fc2eb10b0c721449535f2511097daf7ba9a1763f6ab89e605b840001f6e0172fe71a00389068f144d41c',
      });
      expect(checkOrAskPermission.mock.calls[0][2].fromAccount).toBe(OTHER.address);
    });

    it('signs right after the user connects a site, once its stored permission arrives', async () => {
      const aepp = 'https://just-connected.example';
      const { permissions } = usePermissions();
      checkOrAskPermission.mockImplementationOnce(async () => {
        // As the popup, which answers before the permission it stores gets here
        setTimeout(() => {
          permissions.value['just-connected.example'] = { host: 'just-connected.example', address: true } as any;
        });
        return true;
      });
      await handleEvmRpcMethod(aepp, 'eth_requestAccounts', {});

      expect(await handleEvmRpcMethod(aepp, 'eth_signTypedData_v4', {
        address: SIGNER.address, data: JSON.stringify(permit),
      })).toEqual({ result: PERMIT_SIGNATURE });
    });

    it('rejects a site that revoked its connection', async () => {
      const aepp = 'https://revoked.example';
      const { permissions } = usePermissions();
      permissions.value['revoked.example'] = { host: 'revoked.example', address: true } as any;
      await handleEvmRpcMethod(aepp, 'wallet_revokePermissions', {});

      expect(await handleEvmRpcMethod(aepp, 'eth_signTypedData_v4', {
        address: SIGNER.address, data: JSON.stringify(permit),
      })).toEqual(UNAUTHORIZED);
    });

    it('rejects a site the user disconnected in the settings', async () => {
      const aepp = 'https://disconnected.example';
      const { permissions } = usePermissions();
      permissions.value['disconnected.example'] = { host: 'disconnected.example', address: true } as any;
      await handleEvmRpcMethod(aepp, 'eth_requestAccounts', {});
      delete permissions.value['disconnected.example'];

      expect(await handleEvmRpcMethod(aepp, 'eth_signTypedData_v4', {
        address: SIGNER.address, data: JSON.stringify(permit),
      })).toEqual(UNAUTHORIZED);
    });

    it('signs typed data whose domain names no chain', async () => {
      const { chainId, ...domain } = permit.domain;
      const response = await signTypedData({
        ...permit,
        types: {
          ...permit.types,
          EIP712Domain: permit.types.EIP712Domain.filter(({ name }) => name !== 'chainId'),
        },
        domain,
      });

      // By `@metamask/eth-sig-util` signTypedData V4
      expect(response).toEqual({
        result: '0xaa944b8633c3a0b3a798d6934c9ace6563635338879c4a0a003438b0d6eb4cb0498eaa20473f9f2bd0a7d7875764170dfaa896a8c4cc879aba8cab9fc1e276d11c',
      });
    });

    it('accepts a requested address with a wrong checksum, as MetaMask does', async () => {
      expect(await signTypedData(permit, `0xc${SIGNER.address.slice(3)}`))
        .toEqual({ result: PERMIT_SIGNATURE });
    });

    it('rejects typed data for another chain without asking', async () => {
      const response = await signTypedData({ ...permit, domain: { ...permit.domain, chainId: '0x38' } });
      expect(response.error).toEqual({
        code: -32602,
        message: 'Provided chainId "56" must match the active chainId "1"',
      });
      expect(checkOrAskPermission).not.toHaveBeenCalled();
    });

    it.each([
      ['an account the wallet does not hold', SENDER],
      ['another account of the wallet, which the site was not given', OTHER.address],
      ['an invalid address', 'cow'],
    ])('rejects %s without asking', async (_, address) => {
      expect((await signTypedData(permit, address)).error?.code).toBe(4100);
      expect(checkOrAskPermission).not.toHaveBeenCalled();
    });

    it('rejects malformed typed data without asking', async () => {
      const response = await handleEvmRpcMethod(DAPP, 'eth_signTypedData_v4', { address: SIGNER.address, data: '{' });
      expect(response.error?.code).toBe(-32602);
      expect(checkOrAskPermission).not.toHaveBeenCalled();
    });

    it('returns the rejection of the user', async () => {
      checkOrAskPermission.mockResolvedValue(false);
      expect((await signTypedData(permit)).error?.code).toBe(4001);
    });
  });
});

describe('handleEvmRpcRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkOrAskPermission.mockResolvedValue(true);
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

  describe('with a BNB account active', () => {
    beforeEach(() => { activeProtocol.value = 'bnb'; });
    afterEach(() => { activeProtocol.value = 'ethereum'; });

    it('answers a site, which names no chain, for BNB Smart Chain', async () => {
      const fetchMock = mockNode({ eth_blockNumber: { result: '0x01' } });

      expect(await handleEvmRpcRequest(DAPP, 'eth_chainId', [])).toEqual({ result: '0x38' });
      await handleEvmRpcRequest(DAPP, 'eth_blockNumber', []);
      expect(getNodeRequests(fetchMock)).toMatchObject([{ url: 'https://bnb.node.example' }]);
      expect(await handleEvmRpcRequest(DAPP, 'eth_signTypedData_v4', [
        SIGNER.address, { ...permit, domain: { ...permit.domain, chainId: 56 } },
      ])).toEqual({
        // By `@metamask/eth-sig-util` signTypedData V4
        result: '0x63e3ddfa4e9f3478e30ee71ab502f22872c98c6c9f970edb3cd00f596467ef6e1c3a0069c631c94389f5ab49bb51f2e7ba52f2358082f768eb186b2b792ff6e51c',
      });
    });
  });

  it('answers the methods of the wallet by itself', async () => {
    adapter.fetchBalance.mockResolvedValue('1');
    const fetchMock = mockNode({});

    expect(await handleEvmRpcRequest(DAPP, 'eth_getBalance', [SENDER, 'latest']))
      .toEqual({ result: '0xde0b6b3a7640000' });
    expect(adapter.fetchBalance).toHaveBeenCalledWith(SENDER);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['typed data sent as an object', 'eth_signTypedData_v4', [SIGNER.address, permit], PERMIT_SIGNATURE],
  ])('signs %s', async (_, method, params, signature) => {
    expect(await handleEvmRpcRequest(DAPP, method, params)).toEqual({ result: signature });
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
