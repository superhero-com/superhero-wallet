import type { IToken, ITokenBalance } from '@/types';
import { PROTOCOLS } from '@/constants';
import { fetchJson, toShiftedBigNumber } from '@/utils';
import { ETH_CONTRACT_ID_EXTERNAL } from '../config';

const ETHPLORER_API_KEY = 'freekey';
/**
 * Standard HTTP status code for too many requests
 * ? https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
 */
const TOO_MANY_REQUESTS_ERROR_CODE = 429;

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

  async fetchTopTokens(): Promise<IToken[] | null> {
    const res = await this.fetchFromApi('/getTopTokens');
    if (res?.error?.code === TOO_MANY_REQUESTS_ERROR_CODE) {
      // return null to indicate that we didn't get any new data
      return null;
    }
    const tokens = res.tokens || [];

    return tokens
      .filter(({ address, name, symbol }: any) => (address && name && symbol))
      // Remove the ETH coin from the results because we are adding it manually
      .filter(({ address }: any) => address !== ETH_CONTRACT_ID_EXTERNAL)
      .map((token: any): IToken => this.normalizeTokenStructure(token));
  }

  async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[] | null> {
    const res = await this.fetchFromApi(`/getAddressInfo/${address}`);
    if (res?.error?.code === TOO_MANY_REQUESTS_ERROR_CODE) {
      // return null to indicate that we didn't get any new data
      return null;
    }
    const tokens = res.tokens || [];

    return tokens.map(({
      rawBalance,
      tokenInfo: { address: contractId, decimals },
    }: any): ITokenBalance => ({
      address,
      amount: rawBalance,
      contractId,
      convertedBalance: +toShiftedBigNumber(rawBalance, -decimals).toFixed(2),
      decimals,
      protocol: PROTOCOLS.ethereum,
    })) || [];
  }

  async fetchTokenInfo(contractId: string): Promise<IToken | undefined> {
    const token = await this.fetchFromApi(`/getTokenInfo/${contractId}`);

    return token?.error ? undefined : this.normalizeTokenStructure(token);
  }
}
