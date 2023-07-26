import { Encoded } from '@aeternity/aepp-sdk';
import { Store } from 'vuex';
import { useAeSdk } from '../../composables/aeSdk';
import { BaseProtocol } from '../BaseProtocol';
import { SpendTransactionFee } from '../../types';
import { PROTOCOL_AETERNITY } from '../../popup/utils';

type AeternityAddress = Encoded.AccountAddress;

export class AeternityProtocol implements BaseProtocol {
  static title = PROTOCOL_AETERNITY;

  static symbol = 'AE';

  static derivationPath = 'm/44h/457h'

  store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  async spend(amount: string, recipientId: AeternityAddress, options: any): Promise<string> {
    const { getAeSdk } = useAeSdk({ store: this.store });
    const sdk = await getAeSdk();
    return (await (sdk.spendWithCustomOptions(amount, recipientId, options))).hash;
  }

  async getBalance(address: AeternityAddress): Promise<string> {
    const { getAeSdk } = useAeSdk({ store: this.store });
    const sdk = await getAeSdk();
    return sdk.getBalance(address);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async estimateFeeForSpendTransaction(amount: string): Promise<SpendTransactionFee> {
    const { getAeSdk } = useAeSdk({ store: this.store });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sdk = await getAeSdk();
    // TODO: calculate Fee using the SDK/Helper functions
    return {
      low: '0.122',
      average: '0.234',
      max: '0.319',
    };
  }
}
