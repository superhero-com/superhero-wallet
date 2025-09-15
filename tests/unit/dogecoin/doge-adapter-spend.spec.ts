import { expect, jest } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '../../../src/constants';

jest.mock('../../../src/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        type: NETWORK_TYPE_TESTNET,
        protocols: {
          [PROTOCOLS.dogecoin]: { nodeUrl: 'http://localhost:3000' },
        },
      },
    },
  }),
}));

describe('DogecoinAdapter - spend flow', () => {
  const adapter = new DogecoinAdapter();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('constructs and sends a transaction, returning a txid', async () => {
    const txHex = '010203';
    jest.spyOn(adapter as any, 'constructAndSignTx').mockResolvedValue({
      toHex: () => txHex,
    } as any);

    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (String(url).endsWith('/tx')) {
        return Promise.resolve({ status: 200, text: () => Promise.resolve('txid123') });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }) as any;

    const res = await adapter.spend(1, 'Recipient', {
      address: 'Sender', fee: 0.1, publicKey: Buffer.alloc(33), secretKey: Buffer.alloc(32),
    });
    expect(res).toEqual({ hash: 'txid123' });
  });

  it('throws when broadcast fails', async () => {
    jest.spyOn(adapter as any, 'constructAndSignTx').mockResolvedValue({ toHex: () => 'deadbeef' } as any);
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ status: 500, text: () => Promise.resolve('fail') })) as any;

    await expect(adapter.spend(1, 'R', {
      address: 'S', fee: 0.01, publicKey: Buffer.alloc(33), secretKey: Buffer.alloc(32),
    })).rejects.toThrow('fail');
  });
});
