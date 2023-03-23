/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import { AeSdkWallet, spend, AensName } from '@aeternity/aepp-sdk-13';
import { Encoded } from '@aeternity/aepp-sdk-13/src/utils/encoder';

/**
 * Custom fields in options, `modal` and `payload` for spend function.
 * `modal` is true when user consent popup modal is required
 * `payload` support payload along with the transaction
 */
type ISpendOptions = Omit<Parameters<typeof spend>[2], 'onAccount' | 'onNode', 'onCompiler'>
  & {
    modal?: boolean,
    payload?: Encoded.Any,
  }

declare module '@aeternity/aepp-sdk-13' {
  class AeSdkWallet {
    async spend(
      amount: Parameters<typeof spend>[0],
      recipient: Parameters<typeof spend>[1],
      opt: ISpendOptions,
    ) : ReturnType<spend>;
  }
}
