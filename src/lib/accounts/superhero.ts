import {
  AccountBase,
  sign,
  messageToHash,
  RpcRejectedByUserError,
  unpackTx,
  Encoded,
  METHODS,
} from '@aeternity/aepp-sdk-13';
import { Store } from 'vuex';
import { useAccounts } from '../../composables/accounts';
import { useModals } from '../../composables/modals';
import { IN_FRAME, IS_CORDOVA, IS_EXTENSION_BACKGROUND } from '../environment';
import {
  MODAL_MESSAGE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_TX_SIGN,
} from '../../popup/utils';
import { showPopup } from '../../background/popupHandler';

export class AccountSuperhero extends AccountBase {
  address: Encoded.AccountAddress;

  store: Store<any>;

  constructor(store: Store<any>) {
    super();
    this.store = store;
    const { activeAccount } = useAccounts({ store });
    this.address = activeAccount.value.address as Encoded.AccountAddress;
  }

  signTransaction(txBase64: Encoded.Transaction, opt: any): Promise<Encoded.Transaction> {
    if (IS_CORDOVA) {
      return this.fgPermissionCheckAndSign(POPUP_TYPE_SIGN, txBase64, opt, opt.aeppOrigin);
    }
    if (IS_EXTENSION_BACKGROUND) {
      return this.bgPermissionCheckAndSign(
        POPUP_TYPE_TX_SIGN,
        txBase64,
        { ...opt, origin: opt.aeppOrigin },
      );
    }
    return this.store.dispatch('accounts/signTransaction', { txBase64, opt: { ...opt, onAccount: this.address } });
  }

  async signMessage(message: string, opt: any): Promise<Uint8Array> {
    if (IS_CORDOVA || IN_FRAME) {
      return this.fgPermissionCheckAndSign('message.sign', message, opt, opt.aeppOrigin);
    }
    if (IS_EXTENSION_BACKGROUND) {
      return this.bgPermissionCheckAndSign(
        METHODS.signMessage,
        message,
        { ...opt, origin: opt.aeppOrigin },
      );
    }
    return this.sign(messageToHash(message), opt);
  }

  sign(data: string | Uint8Array, opt: any): Promise<Uint8Array> {
    const { activeAccount } = useAccounts({ store: this.store });
    return IS_EXTENSION_BACKGROUND
      ? sign(data, activeAccount.value.secretKey) as any
      : this.store.dispatch('accounts/sign', data, opt);
  }

  async fgPermissionCheckAndSign(method: any, payload: any, opt: any, origin?: string) {
    try {
      const app = origin ? new URL(origin) : null;
      const permission = (!app?.host && IS_CORDOVA) || await this.store.dispatch('permissions/checkPermissions', {
        host: app?.host,
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
        return this.sign(messageToHash(payload), opt);
      }

      return this.store.dispatch('accounts/signTransaction', {
        txBase64: messageToHash(payload),
        opt: {
          ...opt,
          modal: !permission,
          host: app?.host,
        },
      });
    } catch (error: any) {
      throw new RpcRejectedByUserError(error.message);
    }
  }

  async bgPermissionCheckAndSign(method: METHODS, payload: any, opt: Record<string, any>) {
    const isTxSigning = method === POPUP_TYPE_TX_SIGN;
    if (
      (await this.store.dispatch('permissions/checkPermissions', {
        host: new URL(opt.origin).host,
        method,
        params: opt,
      }))
      || (await showPopup(
        opt.origin,
        isTxSigning ? POPUP_TYPE_SIGN : POPUP_TYPE_MESSAGE_SIGN,
        {
          ...opt,
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
        return this.store.dispatch('accounts/sign', messageToHash(payload));
      }
      return this.store.dispatch('accounts/signTransaction', {
        txBase64: payload,
        opt: {
          ...opt,
          modal: false,
          host: opt.origin,
        },
      });
    }
    throw new RpcRejectedByUserError('Rejected by user');
  }
}
