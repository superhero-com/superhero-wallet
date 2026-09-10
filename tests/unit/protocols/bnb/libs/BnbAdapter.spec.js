import { ProtocolAdapterFactory } from '../../../../../src/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '../../../../../src/constants';
import { BnbAdapter } from '../../../../../src/protocols/bnb/libs/BnbAdapter';

vi.mock('../../../../../src/protocols/bnb/composables/bnbNetworkSettings', () => ({
  useBnbNetworkSettings: () => ({
    bnbActiveNetworkSettings: { value: { nodeUrl: 'https://bsc.rpc', chainId: '56', explorerUrl: 'https://bscscan.com' } },
    bnbActiveNetworkPredefinedSettings: {
      value: {
        explorerUrl: 'https://bscscan.com', middlewareUrl: 'https://api.etherscan.io/v2/api ', tokenMiddlewareUrl: 'https://api.binplorer.com', chainId: '56',
      },
    },
  }),
}));

// consolidated web3-eth mock with instance methods and exported fns
vi.mock('web3-eth', () => {
  const sendSignedTransaction = vi.fn();
  const getBalance = vi.fn();
  const getTransaction = vi.fn();
  const getBlock = vi.fn();
  const getTransactionReceipt = vi.fn();
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

vi.mock('web3-eth-accounts', () => ({
  privateKeyToAddress: () => '0x0000000000000000000000000000000000000001',
  bigIntToHex: (n) => `0x${BigInt(n).toString(16)}`,
  privateKeyToPublicKey: () => new Uint8Array(33),
  Transaction: class {},
  Common: { custom: () => ({}) },
}));

vi.mock('../../../../../src/composables', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: () => ({ protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
}));

// ensure alias path is also mocked when code resolves via '@/composables'
vi.mock('@/composables', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: () => ({ protocol: 'bnb', secretKey: new Uint8Array([1, 2, 3]) }),
  }),
}), { virtual: true });

vi.mock('../../../../../src/protocols/ethereum/composables/ethFeeCalculation', () => ({
  useEthFeeCalculation: () => ({ updateFeeList: vi.fn() }),
}));

vi.mock('web3-types', () => ({ DEFAULT_RETURN_FORMAT: 'json' }));
vi.mock('web3-utils', () => ({
  toChecksumAddress: (a) => a,
  fromWei: (v) => v,
  toWei: (v) => v,
}));
// (second mock removed; merged above)

describe('BnbAdapter registration and metadata', () => {
  it('factory returns BnbAdapter instance for PROTOCOLS.bnb', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    expect(adapter).toBeInstanceOf(BnbAdapter);
  });

  it('coin metadata is set (name, symbol, contractId, decimals)', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    const defaultCoin = adapter.getDefaultCoin();
    expect(defaultCoin.symbol).toBe(adapter.coinSymbol);
    expect(defaultCoin.contractId).toBe(adapter.coinContractId);
    expect(defaultCoin.decimals).toBe(adapter.coinPrecision);
    expect(defaultCoin.name).toBe(adapter.coinName);
  });

  it('isAccountAddressValid validates 0x addresses', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    expect(adapter.isAccountAddressValid('0x0000000000000000000000000000000000000001')).toBe(true);
    expect(adapter.isAccountAddressValid('invalid')).toBe(false);
  });

  it('getExplorer provides bscscan URL', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    const explorer = adapter.getExplorer();
    const url = explorer.prepareUrlForAccount('0x0000000000000000000000000000000000000001');
    expect(url).toContain('bscscan.com');
  });

  // NOTE: Complex signing path is covered in integration; skip heavy network-dependent test here.
});
