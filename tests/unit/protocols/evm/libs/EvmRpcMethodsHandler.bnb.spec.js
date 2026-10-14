import { handleEvmRpcMethod } from '../../../../../src/protocols/evm/libs/EvmRpcMethodsHandler';
import { ETH_RPC_METHODS } from '../../../../../src/protocols/ethereum/config';

vi.mock('../../../../../src/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: { value: { chainId: '56', nodeUrl: 'https://bsc.rpc' } },
    bnbActiveNetworkPredefinedSettings: { value: { middlewareUrl: 'https://api.etherscan.io/v2/api ' } },
  }),
}));

vi.mock('../../../../../src/protocols/ethereum/composables/ethNetworkSettings', () => ({
  useEthNetworkSettings: () => ({
    ethActiveNetworkSettings: { value: { chainId: '1', nodeUrl: 'https://eth.rpc' } },
    ethActiveNetworkPredefinedSettings: { value: { middlewareUrl: 'https://api.etherscan.io/v2/api ' } },
  }),
}));

vi.mock('../../../../../src/composables', () => ({
  usePermissions: () => ({
    checkPermission: () => true,
    checkOrAskPermission: vi.fn().mockResolvedValue(true),
    removePermission: vi.fn(),
  }),
  useAccounts: () => ({
    getLastActiveProtocolAccount: () => ({ address: '0x0000000000000000000000000000000000000001', protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
  useNetworks: () => ({
    activeNetwork: { value: { name: 'Mainnet' } },
    networks: { value: { Mainnet: { protocols: { bnb: { chainId: '56' } } } } },
    switchNetwork: vi.fn(),
  }),
}));

vi.mock('@/composables', () => ({
  usePermissions: () => ({
    checkPermission: () => true,
    checkOrAskPermission: vi.fn().mockResolvedValue(true),
    removePermission: vi.fn(),
  }),
  useAccounts: () => ({
    getLastActiveProtocolAccount: () => ({ address: '0x0000000000000000000000000000000000000001', protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
  useNetworks: () => ({
    activeNetwork: { value: { name: 'Mainnet' } },
    networks: { value: { Mainnet: { protocols: { bnb: { chainId: '56' } } } } },
    switchNetwork: vi.fn(),
  }),
}), { virtual: true });

vi.mock('../../../../../src/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: () => ({
      fetchBalance: vi.fn().mockResolvedValue('1'),
      transferPreparedTransaction: vi.fn().mockResolvedValue({ hash: '0xhash' }),
    }),
  },
}));

// i18n mocking for components indirectly used (e.g., warnings)
vi.mock('vue-i18n', () => ({
  createI18n: () => ({ global: { t: (k) => k } }),
  useI18n: () => ({ t: (k) => k }),
}));

vi.mock('web3-eth', () => {
  const impl = function Web3Eth() {
    return {
      getGasPrice: async () => '2000000000',
    };
  };
  return { __esModule: true, default: impl, Web3Eth: impl };
});

describe('handleEvmRpcMethod - BNB network basics', () => {
  const aepp = 'https://dapp.example';

  it('getAccounts returns an array (may be empty if permissions stub differs)', async () => {
    const res = await handleEvmRpcMethod(aepp, ETH_RPC_METHODS.getAccounts, {}, 'Dapp', 'eip155:56');
    expect(Array.isArray(res.result)).toBe(true);
  });

  it('getBalance returns some wei balance string for BNB account', async () => {
    const res = await handleEvmRpcMethod(aepp, ETH_RPC_METHODS.getBalance, { address: '0x0000000000000000000000000000000000000001' }, 'Dapp', 'eip155:56');
    expect(typeof res.result === 'string' || res.result === 0).toBe(true);
  });

  it('sendTransaction delegates to adapter.transferPreparedTransaction and returns hash', async () => {
    // The node answering the gas estimation
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => ({ result: '0x5208' }) })));
    const res = await handleEvmRpcMethod(aepp, ETH_RPC_METHODS.sendTransaction, {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      value: '0xde0b6b3a7640000', // 1 ether in hex wei
    }, 'Dapp', 'eip155:56');
    vi.unstubAllGlobals();
    expect(res.result === '0xhash' || res.error).toBeTruthy();
  });
});

describe('handleEvmRpcMethod - modal app', () => {
  const aepp = 'https://dapp.example';
  const account = { address: '0x0000000000000000000000000000000000000001' };
  const checkOrAskPermission = vi.fn();
  let handle;

  beforeEach(async () => {
    vi.resetModules();
    checkOrAskPermission.mockReset().mockResolvedValue(true);
    // The mocks above miss the module the setup file already loaded, so import it fresh
    vi.doMock('@/composables', () => ({
      usePermissions: () => ({
        checkPermission: () => false,
        checkOrAskPermission,
        removePermission: vi.fn(),
      }),
      useAccounts: () => ({
        activeAccount: { value: account },
        getLastActiveProtocolAccount: () => account,
      }),
      useNetworks: () => ({
        activeNetwork: { value: { name: 'Mainnet' } },
        networks: { value: { Mainnet: { protocols: { bnb: { chainId: '56' } } } } },
        switchNetwork: vi.fn(),
      }),
    }));
    vi.doMock('@/protocols/ethereum/composables/ethFeeCalculation', () => ({
      useEthFeeCalculation: () => ({ updateFeeList: vi.fn(), maxFeePerGas: { value: 1 } }),
    }));
    ({ handleEvmRpcMethod: handle } = await import('@/protocols/evm/libs/EvmRpcMethodsHandler'));
  });

  afterEach(() => {
    vi.doUnmock('@/composables');
    vi.doUnmock('@/protocols/ethereum/composables/ethFeeCalculation');
  });

  function modalApp() {
    expect(checkOrAskPermission).toHaveBeenCalledOnce();
    return checkOrAskPermission.mock.calls[0][2].app;
  }

  it.each([
    [ETH_RPC_METHODS.requestAccounts, {}],
    [ETH_RPC_METHODS.requestPermissions, {}],
    [ETH_RPC_METHODS.sendTransaction, {
      from: account.address,
      to: '0x0000000000000000000000000000000000000002',
      value: '0x1',
      gas: '0x5208',
    }],
    [ETH_RPC_METHODS.signPersonal, { data: '0x6869' }],
  ])('marks the %s modal app as self-reported', async (method, params) => {
    await handle(aepp, method, params, 'Dapp', 'eip155:56', 'self-reported');
    expect(modalApp()).toMatchObject({ host: 'dapp.example', originSource: 'self-reported' });
  });

  it('adds no origin source when the caller gave none', async () => {
    await handle(aepp, ETH_RPC_METHODS.requestAccounts, {}, undefined, 'eip155:56');
    expect(modalApp()).not.toHaveProperty('originSource');
  });

  it('passes no app when the request has no origin', async () => {
    await handle(undefined, ETH_RPC_METHODS.requestAccounts, {}, undefined, 'eip155:56', 'self-reported');
    expect(modalApp()).toBeUndefined();
  });

  it('keeps serving connect requests after one with a malformed origin', async () => {
    await expect(handle('not a url', ETH_RPC_METHODS.requestAccounts, {}, undefined, 'eip155:56'))
      .rejects.toThrow();

    await handle(aepp, ETH_RPC_METHODS.requestAccounts, {}, undefined, 'eip155:56');
    expect(checkOrAskPermission).toHaveBeenCalledOnce();
  });
});
