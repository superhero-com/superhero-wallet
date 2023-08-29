/**
 * @link https://blockstream.info/
 */
export class Blockstream {
  explorerUrl: string;

  constructor(explorerUrl: string) {
    this.explorerUrl = explorerUrl;
  }

  prepareUrlForHash(address: string) {
    return `${this.explorerUrl}/tx/${address}`;
  }

  prepareUrlForAccount(address: string) {
    return `${this.explorerUrl}/address/${address}`;
  }
}
