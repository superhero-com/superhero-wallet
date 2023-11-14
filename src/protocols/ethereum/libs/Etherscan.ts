export class Etherscan {
  explorerUrl: string;

  constructor(explorerUrl: string) {
    this.explorerUrl = explorerUrl;
  }

  prepareUrlForHash(hash: string) {
    return `${this.explorerUrl}/tx/${hash}`;
  }

  prepareUrlForAccount(address: string) {
    return `${this.explorerUrl}/address/${address}`;
  }
}
