import { PROTOCOLS } from '../../../../../src/constants';
import { AeternityAdapter } from '../../../../../src/protocols/aeternity/libs/AeternityAdapter';

describe('AeternityAdapter token pagination', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches a single paginated token page from middleware', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        data: [{
          contract_id: 'ct_token',
          decimals: 18,
          name: 'Token',
          symbol: 'TKN',
        }],
        next: '/v2/aex9?cursor=next-page',
      }),
    });

    const adapter = new AeternityAdapter();
    const result = await adapter.fetchAvailableTokensPage();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v2/aex9?by=name&limit=100&direction=forward'),
      undefined,
    );
    expect(result).toEqual({
      data: [{
        contractId: 'ct_token',
        decimals: 18,
        name: 'Token',
        symbol: 'TKN',
        protocol: PROTOCOLS.aeternity,
      }],
      next: '/v2/aex9?cursor=next-page',
    });
  });

  it('fetches a prefix search page from middleware', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        data: [{
          contract_id: 'ct_search_token',
          decimals: 18,
          name: 'Alpha Token',
          symbol: 'ALPHA',
        }],
        next: '/v2/aex9?cursor=search-next-page',
      }),
    });

    const adapter = new AeternityAdapter();
    const result = await adapter.fetchAvailableTokensSearchPage('alp', 'symbol');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v2/aex9?by=symbol&prefix=alp&limit=100&direction=forward'),
      undefined,
    );
    expect(result).toEqual({
      data: [{
        contractId: 'ct_search_token',
        decimals: 18,
        name: 'Alpha Token',
        symbol: 'ALPHA',
        protocol: PROTOCOLS.aeternity,
      }],
      next: '/v2/aex9?cursor=search-next-page',
    });
  });
});
