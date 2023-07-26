/* eslint-disable class-methods-use-this */

import { Encoded } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';

export class AeternityAdapter extends BaseProtocolAdapter {
  async getBalance(address: Encoded.AccountAddress): Promise<string> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const sdk = await getAeSdk();
    return sdk.getBalance(address);
  }
}
