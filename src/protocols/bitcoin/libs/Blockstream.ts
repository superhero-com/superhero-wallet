import { ProtocolExplorer } from '@/lib/ProtocolExplorer';

/**
 * @link https://blockstream.info/
 */
export class Blockstream extends ProtocolExplorer {
  explorerUrl: string;

  constructor(explorerUrl: string) {
    super();
    this.explorerUrl = explorerUrl;
  }

  prepareUrlForHash(address: string) {
    return `${this.explorerUrl}/tx/${address}`;
  }

  prepareUrlForAccount(address: string) {
    return `${this.explorerUrl}/address/${address}`;
  }
}
