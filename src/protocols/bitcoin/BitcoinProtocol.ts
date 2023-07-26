/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { BaseProtocol } from '../BaseProtocol';
import { SpendTransactionFee } from '../../types';
import { PROTOCOL_BITCOIN } from '../../popup/utils';

type BitcoinAddress = `bc_${string}`;

export class BitcoinProtocol implements BaseProtocol {
  static title = PROTOCOL_BITCOIN;

  static symbol = '₿'

  static derivationPath = 'm/44h/0h'

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
