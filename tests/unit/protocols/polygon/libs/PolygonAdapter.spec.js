import { ProtocolAdapterFactory } from '../../../../../src/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '../../../../../src/constants';
import { PolygonAdapter } from '../../../../../src/protocols/polygonPos/libs/PolygonPosAdapter';

jest.mock('../../../../../src/protocols/polygonPos/composables/polygonPosNetworkSettings', () => ({
  usePolygonNetworkSettings: () => ({
    polygonActiveNetworkSettings: { value: { nodeUrl: 'https://polygon.rpc', chainId: '137', explorerUrl: 'https://polygonscan.com' } },
    polygonActiveNetworkPredefinedSettings: {
      value: {
        explorerUrl: 'https://polygonscan.com', middlewareUrl: 'https://api.etherscan.io/v2/api ', tokenMiddlewareUrl: 'https://api.ethplorer.io', chainId: '137',
      },
    },
  }),
}));

// consolidated web3-eth mock with instance methods and exported fns
jest.mock('web3-eth', () => {
  const sendSignedTransaction = jest.fn();
  const getBalance = jest.fn();
  const getTransaction = jest.fn();
  const getBlock = jest.fn();
  const getTransactionReceipt = jest.fn();
  const impl = function Web3Eth() {
    return {
      getGasPrice: async () => '2000000000',
      getTransactionCount: async () => 1,
    };
  };
  return {
    __esModule: true,
    default: impl,
    Web3Eth: impl,
    sendSignedTransaction,
    getBalance,
    getTransaction,
    getBlock,
    getTransactionReceipt,
    NUMBER_DATA_FORMAT: 'json',
  };
});

jest.mock('web3-eth-accounts', () => ({
  privateKeyToAddress: () => '0x0000000000000000000000000000000000000001',
  bigIntToHex: (n) => `0x${BigInt(n).toString(16)}`,
  privateKeyToPublicKey: () => new Uint8Array(33),
  Transaction: class {},
  Common: { custom: () => ({}) },
}));

jest.mock('../../../../../src/composables', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: () => ({ protocol: 'polygon', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
}));

// ensure alias path is also mocked when code resolves via '@/composables'
jest.mock('@/composables', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: () => ({ protocol: 'polygon', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
}), { virtual: true });

jest.mock('../../../../../src/protocols/ethereum/composables/ethFeeCalculation', () => ({
  useEthFeeCalculation: () => ({ updateFeeList: jest.fn() }),
}));

jest.mock('web3-types', () => ({ DEFAULT_RETURN_FORMAT: 'json' }));
jest.mock('web3-utils', () => ({
  toChecksumAddress: (a) => a,
  fromWei: (v) => v,
  toWei: (v) => v,
}));

describe('PolygonAdapter registration and metadata', () => {
  it('factory returns PolygonAdapter instance for PROTOCOLS.polygonPos', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.polygonPos);
    expect(adapter).toBeInstanceOf(PolygonAdapter);
  });

  it('coin metadata is set (name, symbol, contractId, decimals)', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.polygonPos);
    const defaultCoin = adapter.getDefaultCoin();
    expect(defaultCoin.symbol).toBe(adapter.coinSymbol);
    expect(defaultCoin.contractId).toBe(adapter.coinContractId);
    expect(defaultCoin.decimals).toBe(adapter.coinPrecision);
    expect(defaultCoin.name).toBe(adapter.coinName);
  });

  it('isAccountAddressValid validates 0x addresses', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.polygonPos);
    expect(adapter.isAccountAddressValid('0x0000000000000000000000000000000000000001')).toBe(true);
    expect(adapter.isAccountAddressValid('invalid')).toBe(false);
  });

  it('getExplorer provides polygonscan URL', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.polygonPos);
    const explorer = adapter.getExplorer();
    const url = explorer.prepareUrlForAccount('0x0000000000000000000000000000000000000001');
    expect(url).toContain('polygonscan.com');
  });
});
