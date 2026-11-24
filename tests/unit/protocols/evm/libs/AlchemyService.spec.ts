import { toChecksumAddress } from 'web3-utils';

import { AlchemyService } from '@/protocols/evm/libs/AlchemyService';

const ACCOUNT = '0x0000000000000000000000000000000000000001';
const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const BROKEN = '0x00000000000000000000000000000000000000ff';
const API_URL = 'https://alchemy.test';

type RpcResult = unknown | ((params: any[]) => unknown);

function stubRpc(results: Record<string, RpcResult>) {
  const fetchMock = vi.fn(async (url: string, { body }: RequestInit) => {
    const { method, params } = JSON.parse(body as string);
    const result = results[method];
    return {
      ok: true,
      status: 200,
      json: async () => ({ result: typeof result === 'function' ? result(params) : result }),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function getCalls(fetchMock: ReturnType<typeof stubRpc>, method: string) {
  return fetchMock.mock.calls
    .map(([url, { body }]: any) => ({ url, ...JSON.parse(body) }))
    .filter((call) => call.method === method);
}

const METADATA = {
  [toChecksumAddress(WBTC)]: { decimals: 8, name: 'Wrapped BTC', symbol: 'WBTC' },
  [toChecksumAddress(USDT)]: { decimals: 6, name: 'Tether USD', symbol: 'USDT' },
};

function getMetadata([contractAddress]: string[]) {
  return METADATA[contractAddress];
}

describe('AlchemyService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps every digit of a token balance', async () => {
    stubRpc({
      alchemy_getTokenBalances: { tokenBalances: [{ contractAddress: WBTC, tokenBalance: '0x16bc50' }] },
      alchemy_getTokenMetadata: { decimals: 8, name: 'Wrapped BTC', symbol: 'WBTC' },
    });

    const [balance] = await new AlchemyService('https://alchemy.test').getTokenBalances(ACCOUNT);

    expect(balance.convertedBalance).toBe(0.0149);
  });

  it('gives each token its own metadata when an earlier balance has an error', async () => {
    stubRpc({
      alchemy_getTokenBalances: {
        tokenBalances: [
          { contractAddress: BROKEN, tokenBalance: '0x1', error: 'execution reverted' },
          { contractAddress: WBTC, tokenBalance: '0x16bc50' },
          { contractAddress: USDT, tokenBalance: '0xf4240' },
        ],
      },
      alchemy_getTokenMetadata: getMetadata,
    });

    const balances = await new AlchemyService(API_URL).getTokenBalances(ACCOUNT);

    expect(balances.map(({ symbol, decimals, convertedBalance }) => (
      { symbol, decimals, convertedBalance }
    ))).toEqual([
      { symbol: 'WBTC', decimals: 8, convertedBalance: 0.0149 },
      { symbol: 'USDT', decimals: 6, convertedBalance: 1 },
    ]);
  });

  it('does not request the metadata of a balance with an error', async () => {
    const fetchMock = stubRpc({
      alchemy_getTokenBalances: {
        tokenBalances: [
          { contractAddress: BROKEN, tokenBalance: '0x1', error: 'execution reverted' },
          { contractAddress: WBTC, tokenBalance: '0x16bc50' },
        ],
      },
      alchemy_getTokenMetadata: getMetadata,
    });

    await new AlchemyService(API_URL).getTokenBalances(ACCOUNT);

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata').map(({ params }) => params[0]))
      .toEqual([toChecksumAddress(WBTC)]);
  });
});
