// @ts-nocheck
import { PROTOCOLS } from '@/constants';
import Logger from '@/lib/logger';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';

/**
 * A failed Etherscan page must reject: an empty page would mark the transaction list
 * as complete. An account without transactions still gets an empty last page.
 */
const ADDRESS = '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c';
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.polygonPos,
  PROTOCOLS.avalanche,
])('%s adapter transactions', (protocol) => {
  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  beforeEach(() => {
    vi.spyOn(Logger, 'write').mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['fetchAccountTransactions', (params) => adapter.fetchAccountTransactions(ADDRESS, params)],
    ['fetchAccountAssetTransactions (coin)', (params) => adapter.fetchAccountAssetTransactions(ADDRESS, adapter.coinContractId, params)],
    ['fetchAccountAssetTransactions (token)', (params) => adapter.fetchAccountAssetTransactions(ADDRESS, TOKEN, params)],
  ])('%s rejects when Etherscan fails', async (_, fetchPage) => {
    vi.spyOn(EtherscanService.prototype, 'fetchFromApi').mockResolvedValue({
      status: '0', message: 'NOTOK', result: 'Max rate limit reached',
    });

    await expect(fetchPage({ nextPageNum: '2' })).rejects.toThrow('Max rate limit reached');
  });

  it('fetchAccountTransactions answers an empty last page for an account without transactions', async () => {
    vi.spyOn(EtherscanService.prototype, 'fetchFromApi').mockResolvedValue({
      status: '0', message: 'No transactions found', result: [],
    });

    expect(await adapter.fetchAccountTransactions(ADDRESS)).toEqual({
      regularTransactions: [],
      paginationParams: {},
    });
  });
});
