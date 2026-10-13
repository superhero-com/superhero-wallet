import { toEvmRpcParams } from '@/protocols/evm/helpers/toEvmRpcParams';

const ADDRESS = '0x5b38da6a701c568545dcfcb03fcb875f56beddc4';
const TX_HASH = '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b';

describe('toEvmRpcParams', () => {
  it.each([
    ['eth_getBalance', [ADDRESS, 'latest'], { address: ADDRESS }],
    ['personal_sign', ['0x68656c6c6f', ADDRESS], { data: '0x68656c6c6f' }],
    ['eth_getTransactionByHash', [TX_HASH], { txhash: TX_HASH }],
    ['eth_getTransactionReceipt', [TX_HASH], { txhash: TX_HASH }],
    ['eth_getBlockByNumber', ['latest', true], { tag: 'latest', boolean: true }],
    ['eth_getUncleByBlockNumberAndIndex', ['0x1', '0x0'], { tag: '0x1', index: '0x0' }],
    [
      'eth_sendTransaction',
      [{ from: ADDRESS, to: ADDRESS, value: '0x1' }],
      { from: ADDRESS, to: ADDRESS, value: '0x1' },
    ],
    ['eth_call', [{ to: ADDRESS, data: '0x' }, 'latest'], { to: ADDRESS, data: '0x', tag: 'latest' }],
    ['wallet_switchEthereumChain', [{ chainId: '0x38' }], { chainId: '0x38' }],
    ['eth_requestAccounts', [], {}],
    ['eth_accounts', undefined, {}],
  ])('maps %s params', (method, params, expected) => {
    expect(toEvmRpcParams(method, params)).toEqual(expected);
  });
});
