import type { ITransaction } from '@/types';
import { ETHERSCAN_API_KEY, TXS_PER_PAGE } from '@/constants';
import { fetchJson } from '@/utils';
import { normalizeTransactionStructure } from '@/protocols/ethereum/helpers';

interface EtherscanDefaultResponse {
  status: '1' | '0';
  message: string; // 'OK' / 'OK-<WithExplanation>'
  result: any;
}

interface EtherscanApiCallParams {
  module: 'account' | 'contract' | 'transaction' | 'block' | 'logs' | 'proxy' | 'stats' | 'gastracker';
  action: 'txlist'; // Extend in the future
  [key: string]: string;
}

/**
 * @see docs.etherscan.io
 */
export class EtherscanService {
  apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  fetchFromApi<T = EtherscanDefaultResponse>(obj: EtherscanApiCallParams): Promise<T | null> {
    const query = new URLSearchParams({
      ...obj,
      apikey: ETHERSCAN_API_KEY, // Without API key amount of calls are limited but still possible
    }).toString();
    return fetchJson<T>(`${this.apiUrl}?${query}`);
  }

  async fetchAccountTransactions(
    address: string,
    page: string = '1',
    offset: string = TXS_PER_PAGE.toString(),
  ): Promise<ITransaction[]> {
    const response = await this.fetchFromApi({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page,
      offset,
      sort: 'asc',
    });

    if (response?.status === '1' && response?.result?.length) {
      return response.result.map(
        (transaction: any) => normalizeTransactionStructure(transaction, address),
      );
    }

    return [];
  }
}
