import { toChecksumAddress } from 'web3-utils';

import type { IToken, ITokenBalance, Protocol } from '@/types';
import {
  postJson,
  toShiftedBigNumber,
} from '@/utils';
import { PROTOCOLS } from '@/constants';

type TokenBalancesResult = {
  tokenBalances: Array<{
    contractAddress: string;
    tokenBalance?: string; // hex string
    error?: string;
    metadata?: {
      decimals?: number;
      name?: string;
      symbol?: string;
      logo?: string;
    };
  }>;
  pageKey?: string;
};

type TokenMetadataResult = {
  decimals?: number;
  name?: string;
  symbol?: string;
  logo?: string;
};

/** By endpoint, protocol and contract; only found tokens are kept */
const tokenMetadataCache = new Map<string, Promise<IToken | undefined>>();

export function clearAlchemyTokenMetadataCache() {
  tokenMetadataCache.clear();
}

export class AlchemyService {
  apiUrl: string;

  protocol: Protocol;

  constructor(apiUrl: string, protocol: Protocol = PROTOCOLS.bnb) {
    this.apiUrl = apiUrl;
    this.protocol = protocol;
  }

  private async rpcCall<T = any>(method: string, params: any): Promise<T | undefined> {
    const body = {
      jsonrpc: '2.0', id: 1, method, params,
    };
    const res = await postJson(this.apiUrl, { body });
    if (!res || res.error) throw new Error(res?.error?.message || 'Alchemy RPC error');
    return res.result;
  }

  /**
   * Fetch ERC-20 token balances for address; enrich with metadata via separate calls
   */
  async getTokenBalances(address: string): Promise<ITokenBalance[]> {
    const result = await this.rpcCall<TokenBalancesResult>(
      'alchemy_getTokenBalances',
      [toChecksumAddress(address), 'erc20'],
    );
    const balances = (result?.tokenBalances || [])
      .filter((b) => !b.error && b.contractAddress);

    const metadataList = await Promise.all(
      balances.map(async (b) => {
        try {
          return await this.getTokenMetadata(b.contractAddress);
        } catch (e) {
          return undefined;
        }
      }),
    );

    return balances
      .map((b, idx) => {
        const md = metadataList[idx];
        const decimals = Number(md?.decimals ?? 0);
        const rawHex = b.tokenBalance || '0x0';
        const rawAmount = (rawHex?.startsWith('0x'))
          ? BigInt(rawHex).toString()
          : String(rawHex || '0');
        const convertedBalance = decimals
          ? toShiftedBigNumber(rawAmount, -decimals).toNumber()
          : 0;
        return {
          address,
          amount: rawAmount,
          contractId: toChecksumAddress(b.contractAddress),
          convertedBalance,
          decimals,
          symbol: md?.symbol,
          name: md?.name,
          protocol: this.protocol,
          price: 0,
        } as ITokenBalance;
      });
  }

  async getTokenMetadata(contractAddress: string): Promise<IToken | undefined> {
    const key = `${this.apiUrl}|${this.protocol}|${contractAddress.toLowerCase()}`;
    if (!tokenMetadataCache.has(key)) {
      tokenMetadataCache.set(key, this.fetchTokenMetadata(contractAddress).then(
        (token) => {
          if (!token) tokenMetadataCache.delete(key);
          return token;
        },
        (error) => {
          tokenMetadataCache.delete(key);
          throw error;
        },
      ));
    }
    const token = await tokenMetadataCache.get(key)!;
    // Callers may change what they get
    return token && { ...token };
  }

  private async fetchTokenMetadata(contractAddress: string): Promise<IToken | undefined> {
    const result = await this.rpcCall<TokenMetadataResult>(
      'alchemy_getTokenMetadata',
      [toChecksumAddress(contractAddress)],
    );
    if (!result?.name || !result?.symbol) return undefined;
    return {
      contractId: toChecksumAddress(contractAddress),
      decimals: Number(result.decimals ?? 0),
      name: result.name,
      protocol: this.protocol,
      symbol: result.symbol,
      image: result.logo,
      price: 0,
    };
  }

  async getTokenAllowance(contract: string, owner: string, spender: string): Promise<string> {
    const result = await this.rpcCall<string>(
      'alchemy_getTokenAllowance',
      [{ contract, owner, spender }],
    );
    return result || '0x0';
  }
}
