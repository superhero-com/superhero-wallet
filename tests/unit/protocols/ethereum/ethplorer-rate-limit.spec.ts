import { PROTOCOLS } from '@/constants';
import { EthplorerService } from '@/protocols/ethereum/libs/EthplorerService';

function stubResponse(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  })));
}

describe('EthplorerService', () => {
  const service = new EthplorerService('https://api.ethplorer.io');
  service.freeVersionTimeDelay = 0;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports no new data when rate limited', async () => {
    stubResponse(429, { error: { code: 429, message: 'Too many requests' } });

    expect(await service.fetchTopTokens(PROTOCOLS.ethereum)).toBeNull();
    expect(await service.fetchAccountTokenBalances('0x0', PROTOCOLS.ethereum)).toBeNull();
    expect(await service.fetchTokenInfo('0x0', PROTOCOLS.ethereum)).toBeUndefined();
  });

  it('throws other HTTP errors', async () => {
    stubResponse(500, {});

    await expect(service.fetchTopTokens(PROTOCOLS.ethereum)).rejects.toThrow('HTTP 500');
  });
});
