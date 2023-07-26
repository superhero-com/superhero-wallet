/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { BaseProtocol } from '../BaseProtocol';
import { SpendTransactionFee } from '../../types';
import { PROTOCOL_DOGECOIN } from '../../popup/utils';

type DogecoinAddress = `D_${string}`;

export class DogecoinProtocol implements BaseProtocol {
  static title = PROTOCOL_DOGECOIN

  static symbol = 'Ɖ';

  static derivationPath = 'm/44h/3h'

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
