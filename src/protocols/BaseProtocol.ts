import { SpendTransactionFee } from '@/types';

/**
 *  Represents common attributes and behavior of a protocol
 */
export abstract class BaseProtocol {
  static title: string;

  static symbol: string;

  static derivationPath: string;

  abstract spend(
    amount: string,
    recipientId: string,
    options: any,
  ): Promise<string>

  abstract getBalance(address: string): Promise<string>;

  abstract estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee>;
}
