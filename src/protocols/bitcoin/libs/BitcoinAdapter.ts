/* eslint-disable class-methods-use-this */

import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';

export class BitcoinAdapter extends BaseProtocolAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBalance(address: string): Promise<string> {
    // TODO: Implement this with bitcoin adapter
    throw new Error('Method not implemented.');
  }
}
