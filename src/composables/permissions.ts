import { METHODS } from '@aeternity/aepp-sdk';

import type {
  IAppData,
  IModalProps,
  IPermission,
  PermissionRegistry,
  PopupType,
} from '@/types';
import {
  IS_OFFSCREEN_TAB,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_SIGN,
  STORAGE_KEYS,
  PROTOCOLS,
} from '@/constants';
import { getCleanModalOptions } from '@/utils';
import { aettosToAe, isTxOfASupportedType } from '@/protocols/aeternity/helpers';
import { openPopup } from '@/offscreen/popupHandler';
import migratePermissionsVuexToComposable from '@/migrations/003-permissions-vuex-to-composable';
import { useStorageRef } from './storageRef';
import { useModals } from './modals';

interface ITransactionSignPermissionOptions {
  amount?: number | string;
  fee?: number | string;
  nameFee?: number | string;
  [x: string]: any;
}

const permissions = useStorageRef<PermissionRegistry>(
  {},
  STORAGE_KEYS.permissions,
  {
    backgroundSync: true,
    migrations: [
      migratePermissionsVuexToComposable,
    ],
  },
);

const modalAndPopupTypes: Partial<Record<METHODS, { modal: string; popup: PopupType }>> = {
  [METHODS.subscribeAddress]: {
    modal: MODAL_CONFIRM_CONNECT,
    popup: POPUP_TYPE_CONNECT,
  },
  [METHODS.address]: {
    modal: MODAL_CONFIRM_ACCOUNT_LIST,
    popup: POPUP_TYPE_ACCOUNT_LIST,
  },
  [METHODS.signMessage]: {
    modal: MODAL_MESSAGE_SIGN,
    popup: POPUP_TYPE_MESSAGE_SIGN,
  },
  [METHODS.unsafeSign]: {
    modal: MODAL_CONFIRM_UNSAFE_SIGN,
    popup: POPUP_TYPE_UNSAFE_SIGN,
  },
  [METHODS.sign]: {
    modal: MODAL_CONFIRM_TRANSACTION_SIGN,
    popup: POPUP_TYPE_SIGN,
  },
  [METHODS.signDelegation]: {
    modal: MODAL_MESSAGE_SIGN,
    popup: POPUP_TYPE_MESSAGE_SIGN,
  },
  [METHODS.signTypedData]: {
    modal: MODAL_MESSAGE_SIGN,
    popup: POPUP_TYPE_MESSAGE_SIGN,
  },
};

/**
 * Composable used to store, compare or ask for permissions to do any DAPP related action,
 * like connecting the wallet, signing messages and transactions.
 */
export function usePermissions() {
  const { openModal } = useModals();

  function resetTransactionSignSpent(host: string) {
    permissions.value[host] = {
      ...permissions.value[host],
      transactionSignSpent: 0,
      transactionSignFirstAskedOn: (new Date()).toISOString(),
    };
  }

  function addPermission(permission: IPermission) {
    permissions.value[permission.host] = permission;
  }

  function removePermission(host: string) {
    delete permissions.value[host];
  }

  function hasDayPassed(isoDate: string) {
    return new Date().getTime() - new Date(isoDate).getTime() >= 24 * 60 * 60 * 1000;
  }

  function checkTransactionSignLimit(
    host: string,
    { amount = 0, fee = 0, nameFee = 0 }: ITransactionSignPermissionOptions,
  ): boolean {
    const {
      transactionSignLimit,
      transactionSignFirstAskedOn,
    } = permissions.value[host] || {};

    if (!transactionSignLimit) {
      return false; // Always ask for permission if limit is not set
    }
    if (!transactionSignFirstAskedOn || hasDayPassed(transactionSignFirstAskedOn)) {
      resetTransactionSignSpent(host);
    }

    const totalCost = +aettosToAe(+amount + +fee + +nameFee);
    const currentAmountSpent = (permissions.value[host].transactionSignSpent || 0) + totalCost;
    if (currentAmountSpent > transactionSignLimit) {
      return false; // Transaction is out of the limit
    }

    permissions.value[host].transactionSignSpent = currentAmountSpent;
    return true;
  }

  function checkPermission(
    host: string,
    method: METHODS,
    transactionSignOptions: ITransactionSignPermissionOptions = {},
  ): boolean {
    const permission = permissions.value[host];
    if (!permission) {
      return false;
    }
    switch (method) {
      case METHODS.sign: return checkTransactionSignLimit(host, transactionSignOptions);
      case METHODS.connect: return permission.address;
      case METHODS.address: return permission.addressList;
      case METHODS.signMessage: return permission.messageSign;
      case METHODS.subscribeAddress: return permission.address;
      default: return false;
    }
  }

  /**
   * Depending on the environment open the modal or popup window with the modal
   * where user is asked to give permission to do an action like connecting
   * or listing user's accounts.
   */
  async function checkOrAskPermission(
    method: METHODS,
    fullUrl?: string,
    modalProps: IModalProps = {},
  ): Promise<boolean> {
    let app: IAppData | undefined;
    let props = getCleanModalOptions<typeof modalProps>(modalProps);

    if (fullUrl) {
      const url = new URL(fullUrl);
      if (checkPermission(url.host, method, modalProps.tx)) {
        return true;
      }

      app = {
        host: url.host,
        name: url.hostname,
        protocol: url.protocol,
        url: url.href,
      };
      props = { ...props, app };
    }

    try {
      let { modal, popup } = modalAndPopupTypes[method] || {};
      if (!modal || !popup) {
        return false;
      }

      // The wallet app is able to recognize and properly display only bunch of transaction types.
      // For every other we need to display different modal with some warnings.
      if (
        method === METHODS.sign
        && (!modalProps.txBase64 || !isTxOfASupportedType(modalProps.txBase64))
        && modalProps.protocol !== PROTOCOLS.ethereum
      ) {
        modal = MODAL_CONFIRM_RAW_SIGN;
        popup = POPUP_TYPE_RAW_SIGN;
      }
      await (
        (IS_OFFSCREEN_TAB && app?.url)
          ? openPopup(popup, app.url, props)
          : openModal(modal, props)
      );
      return true;
    } catch {
      return false;
    }
  }

  function resetPermissions() {
    permissions.value = {};
  }

  return {
    permissions,
    addPermission,
    removePermission,
    checkPermission,
    checkOrAskPermission,
    checkTransactionSignLimit,
    resetPermissions,
  };
}
