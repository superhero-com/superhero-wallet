import { ProtocolExplorer } from '@/lib/ProtocolExplorer';

export class EtherscanExplorer extends ProtocolExplorer {
  explorerUrl: string;

  constructor(explorerUrl: string) {
    super();
    this.explorerUrl = explorerUrl;
  }

  override prepareUrlForHash(hash: string) {
    return `${this.explorerUrl}/tx/${hash}`;
  }

  override prepareUrlForAccount(address: string) {
    return `${this.explorerUrl}/address/${address}`;
  }
}
