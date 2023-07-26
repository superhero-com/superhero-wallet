/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { IProtocol, SpendTransactionFee } from './IProtocol';

type DogecoinAddress = `D_${string}`;

export class DogecoinProtocol implements IProtocol {
  async spend(amount: string, recipientId: DogecoinAddress, options: any): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getBalance(address: DogecoinAddress): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee> {
    throw new Error('Method not implemented.');
  }
}
