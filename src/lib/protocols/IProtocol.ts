/**
 * @file IProtocol.ts
 * @description Represents common properties and behavior of chains
 */

/**
 * Transaction fee varies to control the transaction confirmation speed slow, normal and fast
 */
export interface SpendTransactionFee {
  low: string;
  average: string;
  max: string;
}

export interface IProtocol {
  spend(
    amount: string,
    recipientId: string,
    options: any): Promise<string>
  getBalance(address: string): Promise<string>;
  estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee>;
}
