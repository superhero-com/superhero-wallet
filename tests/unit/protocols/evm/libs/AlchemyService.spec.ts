import { toChecksumAddress } from 'web3-utils';

import { PROTOCOLS } from '@/constants';
import { AlchemyService, clearAlchemyTokenMetadataCache } from '@/protocols/evm/libs/AlchemyService';

const ACCOUNT = '0x0000000000000000000000000000000000000001';
const OTHER_ACCOUNT = '0x0000000000000000000000000000000000000002';
const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const BROKEN = '0x00000000000000000000000000000000000000ff';
const API_URL = 'https://alchemy.test';

type RpcResult = unknown | ((params: any[]) => unknown);

function stubRpc(results: Record<string, RpcResult>) {
  const fetchMock = vi.fn(async (url: string, { body }: RequestInit) => {
    const { method, params } = JSON.parse(body as string);
    const result = results[method];
    if (result instanceof Error) {
      return { ok: false, status: 429, text: async () => '' };
    }
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
    clearAlchemyTokenMetadataCache();
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

  it('requests the metadata of a token once', async () => {
    const fetchMock = stubRpc({
      alchemy_getTokenBalances: { tokenBalances: [{ contractAddress: WBTC, tokenBalance: '0x16bc50' }] },
      alchemy_getTokenMetadata: getMetadata,
    });

    // The adapters create a service for each request
    await new AlchemyService(API_URL).getTokenBalances(ACCOUNT);
    const [balance] = await new AlchemyService(API_URL).getTokenBalances(ACCOUNT);

    expect(getCalls(fetchMock, 'alchemy_getTokenBalances')).toHaveLength(2);
    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(1);
    expect(balance).toMatchObject({ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 });
  });

  it('requests the metadata of a token held by two accounts once', async () => {
    const fetchMock = stubRpc({
      alchemy_getTokenBalances: { tokenBalances: [{ contractAddress: WBTC, tokenBalance: '0x16bc50' }] },
      alchemy_getTokenMetadata: getMetadata,
    });

    const [[first], [second]] = await Promise.all([
      new AlchemyService(API_URL).getTokenBalances(ACCOUNT),
      new AlchemyService(API_URL).getTokenBalances(OTHER_ACCOUNT),
    ]);

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(1);
    expect(first.symbol).toBe('WBTC');
    expect(second.symbol).toBe('WBTC');
  });

  it('shares the metadata between the token balances and the token info', async () => {
    const fetchMock = stubRpc({
      alchemy_getTokenBalances: { tokenBalances: [{ contractAddress: WBTC, tokenBalance: '0x16bc50' }] },
      alchemy_getTokenMetadata: getMetadata,
    });

    await new AlchemyService(API_URL).getTokenBalances(ACCOUNT);
    const token = await new AlchemyService(API_URL).getTokenMetadata(WBTC);

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(1);
    expect(token).toMatchObject({ contractId: toChecksumAddress(WBTC), symbol: 'WBTC' });
  });

  it('requests the metadata again after a failed request', async () => {
    const results: Record<string, RpcResult> = { alchemy_getTokenMetadata: new Error() };
    const fetchMock = stubRpc(results);
    const service = new AlchemyService(API_URL);

    await expect(service.getTokenMetadata(WBTC)).rejects.toThrow('HTTP 429');
    results.alchemy_getTokenMetadata = getMetadata;
    const token = await service.getTokenMetadata(WBTC);

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(2);
    expect(token?.symbol).toBe('WBTC');
  });

  it('shows a token whose metadata failed once its next request succeeds', async () => {
    const results: Record<string, RpcResult> = {
      alchemy_getTokenBalances: { tokenBalances: [{ contractAddress: WBTC, tokenBalance: '0x16bc50' }] },
      alchemy_getTokenMetadata: new Error(),
    };
    stubRpc(results);
    const service = new AlchemyService(API_URL);

    const [failed] = await service.getTokenBalances(ACCOUNT);
    results.alchemy_getTokenMetadata = getMetadata;
    const [balance] = await service.getTokenBalances(ACCOUNT);

    expect(failed).toMatchObject({ symbol: undefined, decimals: 0 });
    expect(balance).toMatchObject({ symbol: 'WBTC', decimals: 8, convertedBalance: 0.0149 });
  });

  it('requests the metadata again when no token was found', async () => {
    const fetchMock = stubRpc({
      alchemy_getTokenMetadata: { decimals: 0, name: null, symbol: null },
    });
    const service = new AlchemyService(API_URL);

    expect(await service.getTokenMetadata(WBTC)).toBeUndefined();
    expect(await service.getTokenMetadata(WBTC)).toBeUndefined();

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(2);
  });

  it('keeps the metadata of each endpoint and protocol apart', async () => {
    const fetchMock = stubRpc({ alchemy_getTokenMetadata: getMetadata });

    await new AlchemyService(API_URL, PROTOCOLS.polygonPos).getTokenMetadata(WBTC);
    await new AlchemyService('https://other-alchemy.test', PROTOCOLS.polygonPos).getTokenMetadata(WBTC);
    const token = await new AlchemyService(API_URL, PROTOCOLS.bnb).getTokenMetadata(WBTC);

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata').map(({ url }) => url))
      .toEqual([API_URL, 'https://other-alchemy.test', API_URL]);
    expect(token?.protocol).toBe(PROTOCOLS.bnb);
  });

  it('finds the metadata of a contract regardless of the address case', async () => {
    const fetchMock = stubRpc({ alchemy_getTokenMetadata: getMetadata });
    const service = new AlchemyService(API_URL);

    await service.getTokenMetadata(WBTC);
    await service.getTokenMetadata(toChecksumAddress(WBTC));

    expect(getCalls(fetchMock, 'alchemy_getTokenMetadata')).toHaveLength(1);
  });

  it('does not let a caller change the metadata of the next one', async () => {
    stubRpc({ alchemy_getTokenMetadata: getMetadata });
    const service = new AlchemyService(API_URL);

    const token = await service.getTokenMetadata(WBTC);
    token!.symbol = 'CHANGED';

    expect((await service.getTokenMetadata(WBTC))?.symbol).toBe('WBTC');
  });
});
