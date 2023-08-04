import { Encoding } from '@aeternity/aepp-sdk';
import { validateHash } from '@/popup/utils';

/**
 * @link https://aescan.io
 */
export class AeScan {
  /**
   * @link https://aeternity-blockchain.atlassian.net/wiki/spaces/AID/pages/127140445/Paths+map+for+migration+Explorer+-+Scan
   */
  static ADDRESS_TYPES: Record<string, string> = {
    [Encoding.AccountAddress]: 'accounts',
    [Encoding.ContractAddress]: 'contracts',
    [Encoding.Name]: 'names',
    [Encoding.OracleAddress]: 'oracles/queries',
    [Encoding.TxHash]: 'transactions',
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
