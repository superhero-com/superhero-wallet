import type { IToken, ITokenBalance } from '@/types';
import { PROTOCOLS } from '@/constants';
import { fetchJson, toShiftedBigNumber } from '@/utils';
import { ETH_CONTRACT_ID_EXTERNAL } from '../config';

const ETHPLORER_API_KEY = 'freekey';

/**
 * @link https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API
 */
export class EthplorerService {
  apiUrl: string;

  /** Resources URL is the same for every network */
  resourcesUrl = 'https://ethplorer.io';

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  fetchFromApi(action: string, params: any = {}) {
    const query = new URLSearchParams({
      ...params,
      apiKey: ETHPLORER_API_KEY, // Without API key amount of calls are limited but still possible
    }).toString();
    return fetchJson(`${this.apiUrl}${action}?${query}`);
  }

  normalizeTokenStructure(token: any): IToken {
    return {
      contractId: token.address,
      decimals: 0, // TODO api does not provide this value so we need to come up how to get this
      name: token.name,
      protocol: PROTOCOLS.ethereum,
      symbol: token.symbol,
      image: (token.image) ? `${this.resourcesUrl}${token.image}` : undefined,
    };
  }

  async fetchTopTokens(): Promise<IToken[]> {
    const tokens = (await this.fetchFromApi('/getTopTokens'))?.tokens || [];

    return tokens
      .filter(({ address, name, symbol }: any) => (address && name && symbol))
      // Remove the ETH coin from the results because as we are adding it manually
      .filter(({ address }: any) => address !== ETH_CONTRACT_ID_EXTERNAL)
      .map((token: any): IToken => this.normalizeTokenStructure(token));
  }

  async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[]> {
    const tokens = (await this.fetchFromApi(`/getAddressInfo/${address}`))?.tokens || [];

    return tokens.map(({
      rawBalance,
      tokenInfo: { address: contractId, decimals },
    }: any): ITokenBalance => ({
      address,
      amount: rawBalance,
      contractId,
      convertedBalance: +toShiftedBigNumber(rawBalance, -decimals).toFixed(2),
      protocol: PROTOCOLS.ethereum,
    })) || [];
  }
}
