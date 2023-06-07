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
import { useModals } from '@/composables/modals';
import {
  IN_FRAME,
  IS_IONIC,
  IS_EXTENSION_BACKGROUND,
  MODAL_MESSAGE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_TX_SIGN,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { showPopup } from '@/background/popupHandler';

export class AccountSuperhero extends AccountBase {
  address: Encoded.AccountAddress;

  store: Store<any>;

  constructor(store: Store<any>) {
    super();
    this.store = store;
    const { getLastActiveProtocolAccount } = useAccounts({ store });
    this.address = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address;
  }

  signTransaction(txBase64: Encoded.Transaction, options: any): Promise<Encoded.Transaction> {
    if (IS_IONIC && options.aeppOrigin) {
      return this.fgPermissionCheckAndSign(POPUP_TYPE_SIGN, txBase64, options, options.aeppOrigin);
    }
    if (IS_EXTENSION_BACKGROUND) {
      return this.bgPermissionCheckAndSign(
        POPUP_TYPE_TX_SIGN,
        txBase64,
        { ...options, origin: options.aeppOrigin },
      );
    }
    return this.store.dispatch('accounts/signTransaction', {
      txBase64,
      options: {
        fromAccount: this.address,
        ...options,
      },
    });
  }

  async signMessage(message: string, options: any): Promise<Uint8Array> {
    if ((IS_IONIC || IN_FRAME) && options.aeppOrigin) {
      return this.fgPermissionCheckAndSign('message.sign', message, options, options.aeppOrigin);
    }
    if (IS_EXTENSION_BACKGROUND) {
      return this.bgPermissionCheckAndSign(
        METHODS.signMessage,
        message,
        { ...options, origin: options.aeppOrigin },
      );
    }
    return this.sign(messageToHash(message), { fromAccount: this.address, ...options });
  }

  sign(data: string | Uint8Array, options: any): Promise<Uint8Array> {
    const { getLastActiveProtocolAccount } = useAccounts({ store: this.store });
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

  async fgPermissionCheckAndSign(method: any, payload: any, options: any, origin?: string) {
    try {
      const app = origin ? new URL(origin) : null;
      const permission = (!origin && IS_IONIC) || await this.store.dispatch('permissions/checkPermissions', {
        host: app ? app.host : null,
        method,
        params: payload,
      });
      if (method === 'message.sign') {
        if (!permission) {
          const { openModal } = useModals();
          await openModal(MODAL_MESSAGE_SIGN, {
            message: payload,
            app: {
              name: app?.hostname,
              icons: [],
              protocol: app?.protocol,
              host: app?.host,
              url: app?.href,
            },
          });
        }
        return this.sign(messageToHash(payload), { fromAccount: this.address, ...options });
      }

      return this.store.dispatch('accounts/signTransaction', {
        txBase64: payload,
        options: {
          fromAccunt: this.address,
          ...options,
          modal: !permission,
          app,
        },
      });
    } catch (error: any) {
      throw new RpcRejectedByUserError(error.message);
    }
  }

  async bgPermissionCheckAndSign(method: METHODS, payload: any, options: Record<string, any>) {
    const isTxSigning = method === POPUP_TYPE_TX_SIGN;
    if (
      (await this.store.dispatch('permissions/checkPermissions', {
        host: new URL(options.origin).host,
        method,
        params: options,
      }))
      || (await showPopup(
        options.origin,
        isTxSigning ? POPUP_TYPE_SIGN : POPUP_TYPE_MESSAGE_SIGN,
        {
          ...options,
          ...(isTxSigning)
            ? {
              tx: payload,
              txObject: unpackTx(payload),
            }
            : {
              message: payload,
            },
        },
      ).then(
        () => true,
        () => false,
      ))
    ) {
      if (method === METHODS.signMessage) {
        return this.store.dispatch('accounts/sign', { data: messageToHash(payload), options: { fromAccount: this.address } });
      }
      return this.store.dispatch('accounts/signTransaction', {
        txBase64: payload,
        options: {
          fromAccount: this.address,
          ...options,
          modal: false,
          host: options.origin,
        },
      });
    }
    throw new RpcRejectedByUserError('Rejected by user');
  }
}
