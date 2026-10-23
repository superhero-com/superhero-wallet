import {
  Component,
  computed,
  nextTick,
  ref,
} from 'vue';
import type {
  IModalProps,
  Protocol,
  ProtocolView,
  StatusIconType,
} from '@/types';
import {
  IN_FRAME,
  IS_WEB,
  MODAL_BIOMETRIC_LOGIN,
  MODAL_CONFIRM,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_DEFAULT,
  MODAL_ENABLE_BIOMETRIC_LOGIN,
  MODAL_ERROR_LOG,
  MODAL_MESSAGE_SIGN,
  MODAL_PASSWORD_LOGIN,
  MODAL_SCAN_QR,
  MODAL_SET_PASSWORD,
  MODAL_SHARE_ADDRESS,
} from '@/constants';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import { ROUTE_WEB_IFRAME_POPUP } from '@/popup/router/routeNames';

import { usePopupProps } from './popupProps';

/**
 * Settings used when registering the modal.
 */
interface IModalSettings {
  component?: Component;
  showInPopupIfWebFrame?: boolean;
  /**
   * Usable only with `ProtocolSpecificView` passed to the `component` property.
   */
  viewComponentName?: ProtocolView;
}

/**
 * Params passed to the modal when trying to open it.
 */
interface IOpenModalParams {
  name: string;
  key: number;
  inPopup: boolean;
  props: IModalProps;
}

/**
 * Confirmations of a dapp's request. The dapp, and the requests queued after it,
 * wait for an answer, so one closed by the wallet is answered as rejected.
 */
const DAPP_REQUEST_MODALS: string[] = [
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_MESSAGE_SIGN,
];

const modalsRegistered = new Map<string, IModalSettings>();
const modalsOpenRaw = ref<IOpenModalParams[]>([]);
let currentIndex = 0;
let popupWindow: Window | null = null;
let lastPopupPromise: Promise<any> = Promise.resolve();

function registerModal(name: string, settings: IModalSettings) {
  if (modalsRegistered.has(name)) {
    throw new Error(`Modal with name "${name}" already registered`);
  }
  modalsRegistered.set(name, settings);
}

/**
 * Composable that handles the logic of modal windows.
 * The modal opens in 2 ways:
 *
 * 1. If the app is working as an extension, mobile app or web app the modals opens
 *    as a stack of layers displayed above the actual app.
 * 2. If the app is open inside a web iframe (e.g. as a widget on the Superhero.com)
 *    and the modal is registered with `showInPopupIfWebFrame` flag
 *    open separate browser window (popup) with the app covered with the modal
 *    taking whole space. Popup modal routes: router/webIframePopups.ts
 */
export function useModals() {
  const modalsOpen = computed(
    () => modalsOpenRaw.value
      .filter(({ inPopup }) => !inPopup)
      .map(({ name, ...other }) => ({
        name,
        ...other,
        ...modalsRegistered.get(name),
      })),
  );

  function closeModalByKey(key: number) {
    const idx = modalsOpenRaw.value.findIndex((modal) => modal.key === key);
    if (idx < 0) return;

    modalsOpenRaw.value[idx].props.show = false;
    nextTick(() => {
      const currentIdx = modalsOpenRaw.value.findIndex((modal) => modal.key === key);
      if (currentIdx > -1) {
        modalsOpenRaw.value.splice(currentIdx, 1);
      }
    });
  }

  function openModal<T = void>(name: string, props: IModalProps = {}): Promise<T> {
    const modalSettings = modalsRegistered.get(name);

    if (!modalSettings) {
      return Promise.reject(new Error(`Modal with name "${name}" not registered`));
    }

    const inPopup = IN_FRAME && IS_WEB && !!modalSettings.showInPopupIfWebFrame;
    const key = currentIndex + 1;
    currentIndex += 1;

    const modalPromise = new Promise<T>((resolve, reject) => {
      modalsOpenRaw.value.push({
        name,
        key,
        inPopup,
        props: {
          ...props, resolve, reject, show: true,
        },
      });

      /**
       * These modals use the `usePopupProps` composable instead of props
       * even if they are not opened in a popup
       */
      if (modalSettings.showInPopupIfWebFrame && !inPopup) {
        const { setPopupProps } = usePopupProps();
        setPopupProps({
          ...props, resolve, reject,
        });
      }

      if (inPopup) {
        if (popupWindow) {
          popupWindow.focus();
        }

        lastPopupPromise
          .catch(() => { })
          .finally(() => {
            popupWindow = window.open(
              `/${ROUTE_WEB_IFRAME_POPUP}/${name}`,
              `popup-${key}`,
              'height=600,width=375',
            );
            if (!popupWindow) {
              reject(new Error("Can't show popup window"));
            } else {
              popupWindow.popupProps = {
                ...props, resolve, reject, show: true,
              };
            }
          });
      }
    })
      .finally(() => closeModalByKey(key));

    if (inPopup) {
      lastPopupPromise = modalPromise;
    }

    return modalPromise;
  }

  function openDefaultModal(options: {
    title?: string;
    msg?: string;
    icon?: StatusIconType;
    buttonMessage?: string;
    textCenter?: boolean;
  }) {
    return openModal(MODAL_DEFAULT, options);
  }

  function openConfirmModal(options: {
    title?: string;
    msg?: string;
    icon?: StatusIconType;
    buttonMessage?: string;
  }) {
    return openModal(MODAL_CONFIRM, options);
  }

  function openErrorModal(options: {
    title?: string;
    msg?: string;
  }) {
    return openModal(MODAL_ERROR_LOG, options).catch(handleUnknownError);
  }

  function openScanQrModal(options: {
    title: string;
  }) {
    return openModal<string>(MODAL_SCAN_QR, options);
  }

  function openShareAddressModal(options: {
    address: string;
    protocol: Protocol;
    title?: string;
  }) {
    return openModal(MODAL_SHARE_ADDRESS, options);
  }

  async function openSetPasswordModal(isRestoredWallet = false) {
    return openModal<string>(MODAL_SET_PASSWORD, {
      isRestoredWallet,
    });
  }

  function openBiometricLoginModal(options?: IModalProps & {
    force?: boolean;
    deferAuthStateUpdate?: boolean;
  }) {
    return openModal(MODAL_BIOMETRIC_LOGIN, options);
  }

  function openPasswordLoginModal() {
    return openModal(MODAL_PASSWORD_LOGIN);
  }

  async function openEnableBiometricLoginModal() {
    openModal(MODAL_ENABLE_BIOMETRIC_LOGIN);
  }

  function closeAllModals() {
    modalsOpenRaw.value?.forEach(({ key, name, props }) => {
      // Others are left unsettled, as before: e.g. the reset modal resolves itself after this.
      if (DAPP_REQUEST_MODALS.includes(name) && props.reject) {
        props.reject?.(new RejectedByUserError());
      } else {
        closeModalByKey(key);
      }
    });
  }

  return {
    modalsOpen,
    closeAllModals,
    registerModal,
    openModal,
    openDefaultModal,
    openConfirmModal,
    openErrorModal,
    openScanQrModal,
    openShareAddressModal,
    openSetPasswordModal,
    openBiometricLoginModal,
    openPasswordLoginModal,
    openEnableBiometricLoginModal,
    closeModalByKey,
  };
}
