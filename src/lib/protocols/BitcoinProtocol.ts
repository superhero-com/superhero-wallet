/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { IProtocol, SpendTransactionFee } from './IProtocol';

type BitcoinAddress = `bc_${string}`;

export class BitcoinProtocol implements IProtocol {
  async spend(amount: string, recipientId: BitcoinAddress, options: any): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getBalance(address: BitcoinAddress): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee> {
    throw new Error('Method not implemented.');
  }
}
