import { toEvmRpcParams } from '@/protocols/evm/helpers/toEvmRpcParams';

const ADDRESS = '0x5b38da6a701c568545dcfcb03fcb875f56beddc4';

describe('toEvmRpcParams', () => {
  it.each([
    ['eth_getBalance', [ADDRESS, 'latest'], { address: ADDRESS }],
    ['personal_sign', ['0x68656c6c6f', ADDRESS], { data: '0x68656c6c6f' }],
    ['eth_signTypedData_v4', [ADDRESS, '{"primaryType":"M"}'], { address: ADDRESS, data: '{"primaryType":"M"}' }],
    ['eth_signTypedData_v4', [ADDRESS, { primaryType: 'M' }], { address: ADDRESS, data: '{"primaryType":"M"}' }],
    [
      'eth_sendTransaction',
      [{ from: ADDRESS, to: ADDRESS, value: '0x1' }],
      { from: ADDRESS, to: ADDRESS, value: '0x1' },
    ],
    ['wallet_switchEthereumChain', [{ chainId: '0x38' }], { chainId: '0x38' }],
    ['eth_requestAccounts', [], {}],
    ['eth_accounts', undefined, {}],
    ['wallet_getCapabilities', [ADDRESS], {}],
  ])('maps %s params', (method, params, expected) => {
    expect(toEvmRpcParams(method, params)).toEqual(expected);
  });
});
