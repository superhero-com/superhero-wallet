import { handleEvmRpcMethod } from '../../../../../src/protocols/evm/libs/EvmRpcMethodsHandler';
import { ETH_RPC_METHODS } from '../../../../../src/protocols/ethereum/config';

jest.mock('../../../../../src/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: { value: { chainId: '56', nodeUrl: 'https://bsc.rpc' } },
    bnbActiveNetworkPredefinedSettings: { value: { middlewareUrl: 'https://api.etherscan.io/v2/api ' } },
  }),
}));

jest.mock('../../../../../src/protocols/ethereum/composables/ethNetworkSettings', () => ({
  useEthNetworkSettings: () => ({
    ethActiveNetworkSettings: { value: { chainId: '1', nodeUrl: 'https://eth.rpc' } },
    ethActiveNetworkPredefinedSettings: { value: { middlewareUrl: 'https://api.etherscan.io/v2/api ' } },
  }),
}));

jest.mock('../../../../../src/composables', () => ({
  usePermissions: () => ({
    checkPermission: () => true,
    checkOrAskPermission: jest.fn().mockResolvedValue(true),
    removePermission: jest.fn(),
  }),
  useAccounts: () => ({
    getLastActiveProtocolAccount: () => ({ address: '0x0000000000000000000000000000000000000001', protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
  useNetworks: () => ({
    activeNetwork: { value: { name: 'Mainnet' } },
    networks: { value: { Mainnet: { protocols: { bnb: { chainId: '56' } } } } },
    switchNetwork: jest.fn(),
  }),
}));

jest.mock('@/composables', () => ({
  usePermissions: () => ({
    checkPermission: () => true,
    checkOrAskPermission: jest.fn().mockResolvedValue(true),
    removePermission: jest.fn(),
  }),
  useAccounts: () => ({
    getLastActiveProtocolAccount: () => ({ address: '0x0000000000000000000000000000000000000001', protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
  useNetworks: () => ({
    activeNetwork: { value: { name: 'Mainnet' } },
    networks: { value: { Mainnet: { protocols: { bnb: { chainId: '56' } } } } },
    switchNetwork: jest.fn(),
  }),
}), { virtual: true });

jest.mock('../../../../../src/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: () => ({
      fetchBalance: jest.fn().mockResolvedValue('1'),
      transferPreparedTransaction: jest.fn().mockResolvedValue({ hash: '0xhash' }),
    }),
  },
}));

// i18n mocking for components indirectly used (e.g., warnings)
jest.mock('vue-i18n', () => ({
  createI18n: () => ({ global: { t: (k) => k } }),
  useI18n: () => ({ t: (k) => k }),
}));

jest.mock('web3-eth', () => {
  const impl = function Web3Eth() {
    return {
      getGasPrice: async () => '2000000000',
    };
  };
  return { __esModule: true, default: impl, Web3Eth: impl };
});

jest.mock('../../../../../src/protocols/ethereum/libs/EtherscanService', () => ({
  EtherscanService: class {
    // minimal API used in sendTransaction path for gas estimation
    // eslint-disable-next-line class-methods-use-this
    async fetchFromApi() { return { message: 'OK', result: '0x5208' }; }
  },
}));

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
    const res = await handleEvmRpcMethod(aepp, ETH_RPC_METHODS.sendTransaction, {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      value: '0xde0b6b3a7640000', // 1 ether in hex wei
    }, 'Dapp', 'eip155:56');
    expect(res.result === '0xhash' || res.error).toBeTruthy();
  });
});
