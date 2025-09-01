import type { IToken, ITokenBalance, Protocol } from '@/types';
import { ETHPLORER_API_KEY } from '@/constants';
import {
  fetchJson,
  toShiftedBigNumber,
  sleep,
  amountRounded,
} from '@/utils';
import { ETH_CONTRACT_ID_EXTERNAL } from '../config';
import { toEthChecksumAddress } from '../helpers';

const ethplorerApiKey = ETHPLORER_API_KEY || 'freekey';
/**
 * Standard HTTP status code for too many requests
 * ? https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
 */
const TOO_MANY_REQUESTS_ERROR_CODE = 429;

let lastCallTime: number;

/**
 * @link https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API
 */
export class EthplorerService {
  apiUrl: string;

  /** Resources URL is the same for every network */
  resourcesUrl = 'https://ethplorer.io';

  freeVersionTimeDelay = 600;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchFromApi(action: string, params: any = {}) {
    const query = new URLSearchParams({
      ...params,
      apiKey: ethplorerApiKey, // Without API key amount of calls are limited but still possible
    }).toString();

    // Without API key amount of calls are limited to two per every 1 second.
    // We're adding delays between calls to avoid getting empty results.
    // TODO: Use own node or paid version
    if (!ethplorerApiKey || ethplorerApiKey === 'freekey') {
      const currTime = new Date().getTime();
      const timeToWait = (lastCallTime) ? this.freeVersionTimeDelay - (currTime - lastCallTime) : 0;
      lastCallTime = currTime + ((timeToWait > 0) ? timeToWait : 0);
      if (timeToWait > 0) {
        await sleep(timeToWait);
      }
    }
    return fetchJson(`${this.apiUrl}${action}?${query}`);
  }

  normalizeTokenStructure(token: any, protocol: Protocol): IToken {
    return {
      contractId: toEthChecksumAddress(token.address),
      decimals: Number(token.decimals),
      name: token.name,
      protocol,
      symbol: token.symbol,
      image: (token.image) ? `${this.resourcesUrl}${token.image}` : undefined,
      // TODO: get an actual info about token price
      price: 0,
    };
  }

  async fetchTopTokens(protocol: Protocol): Promise<IToken[] | null> {
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
      .map((token: any): IToken => this.normalizeTokenStructure(token, protocol));
  }

  async fetchAccountTokenBalances(
    address: string,
    protocol: Protocol,
  ): Promise<ITokenBalance[] | null> {
    const res = await this.fetchFromApi(`/getAddressInfo/${address}`);
    if (res?.error?.code === TOO_MANY_REQUESTS_ERROR_CODE) {
      // return null to indicate that we didn't get any new data
      return null;
    }
    const tokens = res.tokens || [];

    return tokens.map(({
      rawBalance,
      tokenInfo: {
        address: contractId,
        decimals,
        name,
        symbol,
      },
    }: any): ITokenBalance => ({
      address,
      amount: rawBalance,
      contractId: toEthChecksumAddress(contractId),
      convertedBalance: +amountRounded(toShiftedBigNumber(rawBalance, -decimals)),
      decimals,
      symbol,
      name,
      protocol,
      price: 0,
    })) || [];
  }

  async fetchTokenInfo(contractId: string, protocol: Protocol): Promise<IToken | undefined> {
    const token = await this.fetchFromApi(`/getTokenInfo/${contractId}`);

    return token?.error ? undefined : this.normalizeTokenStructure(token, protocol);
  }
}
