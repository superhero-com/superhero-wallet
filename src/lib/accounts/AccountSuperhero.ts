import {
  AccountBase,
  sign,
  messageToHash,
  RpcRejectedByUserError,
  unpackTx,
  Encoded,
  METHODS,
} from '@aeternity/aepp-sdk';
import { Store } from 'vuex';
import { useAccounts } from '@/composables/accounts';
import { usePermissions } from '@/composables/permissions';
import {
  IS_MOBILE_APP,
  IS_EXTENSION_BACKGROUND,
  POPUP_TYPE_SIGN,
  PROTOCOL_AETERNITY,
  IN_FRAME,
} from '@/constants';
import { openPopup } from '@/background/popupHandler';

export class AccountSuperhero extends AccountBase {
  address: Encoded.AccountAddress;

  store: Store<any>;

  constructor(store: Store<any>) {
    super();
    this.store = store;
    const { getLastActiveProtocolAccount } = useAccounts();
    this.address = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address;
  }

  async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    const { aeppOrigin } = options;
    const app = aeppOrigin ? new URL(aeppOrigin) : null;
    const { checkPermission } = usePermissions();

    try {
      if (IS_EXTENSION_BACKGROUND && aeppOrigin) {
        const txObject = unpackTx(txBase64);
        if (
          (checkPermission(new URL(aeppOrigin).host, METHODS.sign, txObject))
          || (await openPopup(
            POPUP_TYPE_SIGN,
            aeppOrigin,
            {
              ...options,
              tx: txBase64,
              txObject,
            },
          ).then(() => true, () => false))
        ) {
          return this.store.dispatch('accounts/signTransaction', {
            txBase64,
            options: {
              fromAccount: this.address,
              ...options,
              modal: false, // Already asked for permission with the popup window
              app,
            },
          });
        }
      }

      return this.store.dispatch('accounts/signTransaction', {
        txBase64,
        options: {
          fromAccount: this.address,
          ...options,
          modal: !!aeppOrigin, // Ask for permission if deep linking
          app,
        },
      });
    } catch (error: any) {
      throw new RpcRejectedByUserError(error.message);
    }
  }

  async signMessage(
    message: string,
    options: Parameters<AccountBase['signMessage']>[1],
  ): Promise<Uint8Array> {
    if (
      (IS_MOBILE_APP || IS_EXTENSION_BACKGROUND || IN_FRAME)
      && options?.aeppOrigin
    ) {
      const { checkOrAskPermission } = usePermissions();
      const hasPermission = await checkOrAskPermission(
        options?.aeppOrigin,
        METHODS.signMessage,
        { message },
      );
      if (!hasPermission) {
        throw new RpcRejectedByUserError('Rejected by user');
      }
    }

    return (IS_EXTENSION_BACKGROUND)
      ? this.store.dispatch('accounts/sign', {
        data: messageToHash(message),
        options: { fromAccount: this.address },
      })
      : this.sign(messageToHash(message), options);
  }

  sign(
    data: string | Uint8Array,
    options: Parameters<AccountBase['sign']>[1],
  ): Promise<Uint8Array> {
    const { getLastActiveProtocolAccount } = useAccounts();
    return IS_EXTENSION_BACKGROUND
      ? sign(data, getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.secretKey) as any
      : this.store.dispatch('accounts/sign', {
        data,
        options: {
          fromAccount: this.address,
          ...options,
        },
      });
  }
}
