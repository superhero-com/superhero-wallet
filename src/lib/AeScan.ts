import {
  HASH_PREFIX_ACCOUNT,
  HASH_PREFIX_CONTRACT,
  HASH_PREFIX_NAME,
  HASH_PREFIX_ORACLE,
  HASH_PREFIX_TRANSACTION,
  validateHash,
} from '../popup/utils';

/**
 * @link https://aescan.io
 */
export class AeScan {
  /**
   * @link https://aeternity-blockchain.atlassian.net/wiki/spaces/AID/pages/127140445/Paths+map+for+migration+Explorer+-+Scan
   */
  static ADDRESS_TYPES: Record<string, string> = {
    [HASH_PREFIX_ACCOUNT]: 'accounts',
    [HASH_PREFIX_CONTRACT]: 'contracts/transactions',
    [HASH_PREFIX_NAME]: 'names',
    [HASH_PREFIX_ORACLE]: 'oracles/queries',
    [HASH_PREFIX_TRANSACTION]: 'transactions',
  };

  explorerUrl: string;

  constructor(explorerUrl: string) {
    this.explorerUrl = explorerUrl;
  }

  static getEndpointByHash(hash: string) {
    const { valid, prefix } = validateHash(hash);
    if (valid && prefix) {
      return AeScan.ADDRESS_TYPES[prefix];
    }
    return undefined;
  }

  prepareUrlByHash(hash: string): string | undefined {
    const endpoint = AeScan.getEndpointByHash(hash);
    return (endpoint) ? `${this.explorerUrl}/${endpoint}/${hash}` : undefined;
  }

  prepareUrlForAccount(address: string) {
    return `${this.explorerUrl}/accounts/${address}`;
  }
}
