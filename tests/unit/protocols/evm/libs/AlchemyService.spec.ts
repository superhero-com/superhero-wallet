import { AlchemyService } from '@/protocols/evm/libs/AlchemyService';

const ACCOUNT = '0x0000000000000000000000000000000000000001';
const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

function stubRpc(results: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, { body }: RequestInit) => ({
    ok: true,
    status: 200,
    json: async () => ({ result: results[JSON.parse(body as string).method] }),
  })));
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
});
