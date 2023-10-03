import { METHODS } from '@aeternity/aepp-sdk';
import type {
  IAppData,
  IPermission,
  PermissionRegistry,
  PopupType,
} from '@/types';
import {
  IS_EXTENSION_BACKGROUND,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_MESSAGE_SIGN,
  STORAGE_KEYS,
} from '@/constants';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import { openPopup } from '@/background/popupHandler';
import migratePermissionsVuexToComposable from '@/migrations/003-permissions-vuex-to-composable';
import { useStorageRef } from './storageRef';
import { IModalProps, useModals } from './modals';

interface ITransactionSignPermissionOptions {
  amount?: number;
  fee?: number;
  nameFee?: number;
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

const modalAndPopupTypes: Partial<Record<METHODS, { modal: string, popup: PopupType }>> = {
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
  // TODO add `METHODS.sign` by moving the `hdWallet/confirmTxSigning` logic here.
};

/**
 * Composable used to store, compare or ask for permissions to do any DAPP related action,
 * like connecting the wallet, signing messages and transactions.
 */
export function usePermissions() {
  const { openModal } = useModals();

  function setTransactionSignLimitLeft(host: string, value: number) {
    permissions.value[host] = {
      ...permissions.value[host],
      transactionSignLimitLeft: value,
    };
  }

  function resetTransactionSignLimitLeft(host: string) {
    permissions.value[host] = {
      ...permissions.value[host],
      transactionSignLimitLeft: permissions.value[host].transactionSignLimit,
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
      return false; // Always ask for permission if no limit is set
    }
    if (!transactionSignFirstAskedOn || hasDayPassed(transactionSignFirstAskedOn)) {
      resetTransactionSignLimitLeft(host);
    }

    const totalCost = +aettosToAe(+amount + +fee + +nameFee);
    const futureLimitLeft = permissions.value[host].transactionSignLimitLeft - totalCost;
    if (futureLimitLeft < 0) {
      return false;
    }

    setTransactionSignLimitLeft(host, futureLimitLeft);
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
    fullUrl: string,
    method: METHODS,
    modalProps: IModalProps = {},
  ): Promise<boolean> {
    const url = new URL(fullUrl);
    if (checkPermission(url.host, method)) {
      return true;
    }

    const app: IAppData = {
      host: url.host,
      name: url.hostname,
      protocol: url.protocol,
      url: url.href,
    };

    try {
      const { modal, popup } = modalAndPopupTypes[method] || {};
      if (!modal || !popup) {
        return false;
      }

      await (
        (IS_EXTENSION_BACKGROUND)
          ? openPopup(popup, url.href, modalProps)
          : openModal(modal, { ...modalProps, app })
      );
      return true;
    } catch {
      return false;
    }
  }

  return {
    permissions,
    addPermission,
    removePermission,
    checkPermission,
    checkOrAskPermission,
    checkTransactionSignLimit,
  };
}
