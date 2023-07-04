import {
  AccountBase,
  sign,
  messageToHash,
  RpcRejectedByUserError,
  unpackTx,
  Encoded,
} from '@aeternity/aepp-sdk-13';
import { Store } from 'vuex';
import { useAccounts } from '../../composables/accounts';
import { IS_MOBILE, IS_EXTENSION_BACKGROUND } from '../environment';
import { POPUP_TYPE_MESSAGE_SIGN, POPUP_TYPE_SIGN, POPUP_TYPE_TX_SIGN } from '../../popup/utils';
import { showPopup } from '../../background/popupHandler';
import type { IPopupType } from '../../types';

export class AccountSuperhero extends AccountBase {
  address: Encoded.AccountAddress;

  store: Store<any>;

  aeppInfo: Record<string, any> = {};

  constructor(store: Store<any>) {
    super();
    this.store = store;
    const { activeAccount } = useAccounts({ store });
    this.address = activeAccount.value.address as Encoded.AccountAddress;
  }

  signTransaction(txBase64: Encoded.Transaction, opt: any): Promise<Encoded.Transaction> {
    if (IS_MOBILE) {
      return this.fgPermissionCheckAndSign(txBase64, opt, opt.aeppOrigin);
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

  signMessage(message: string, opt: any): Promise<Uint8Array> {
    if (IS_MOBILE) {
      return this.fgPermissionCheckAndSign(messageToHash(message), opt, opt.aeppOrigin);
    }
    if (IS_EXTENSION_BACKGROUND) {
      return this.bgPermissionCheckAndSign(
        POPUP_TYPE_MESSAGE_SIGN,
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

  async fgPermissionCheckAndSign(payload: any, opt: any, origin?: string) {
    try {
      const host = origin ? new URL(origin).host : null;
      const permission = (!host && IS_MOBILE) || await this.store.dispatch('permissions/checkPermissions', {
        host,
        method: POPUP_TYPE_SIGN,
        params: payload,
      });

      return this.store.dispatch('accounts/signTransaction', {
        txBase64: payload,
        opt: {
          ...opt,
          modal: !permission,
          host,
        },
      });
    } catch (error: any) {
      throw new RpcRejectedByUserError(error.message);
    }
  }

  async bgPermissionCheckAndSign(method: IPopupType, payload: any, opt: Record<string, any>) {
    const aepp = this.aeppInfo[opt.aeppRpcClientId];
    const isTxSigning = method === POPUP_TYPE_TX_SIGN;
    if (
      (await this.store.dispatch('permissions/checkPermissions', {
        host: new URL(aepp.origin).host,
        method,
        params: opt,
      }))
      || (await showPopup(
        aepp.origin,
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
      if (method === POPUP_TYPE_MESSAGE_SIGN) {
        return this.store.dispatch('accounts/sign', messageToHash(payload));
      }
      return this.store.dispatch('accounts/signTransaction', {
        txBase64: payload,
        opt: {
          ...opt,
          modal: false,
          host: aepp.origin,
        },
      });
    }
    throw new RpcRejectedByUserError('Rejected by user');
  }
}
