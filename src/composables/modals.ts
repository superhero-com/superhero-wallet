import {
  Component,
  computed,
  nextTick,
  ref,
} from 'vue';
import { TranslateResult } from 'vue-i18n';
import type {
  ProtocolView,
  RejectCallback,
  ResolveCallback,
  StatusIconType,
} from '@/types';
import {
  IN_FRAME,
  IS_WEB,
  MODAL_DEFAULT,
  MODAL_ERROR_LOG,
} from '@/constants';
import { handleUnknownError } from '@/utils';
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

interface IModalProps {
  [key: string]: any; // Props defined on the component's level
  resolve?: ResolveCallback;
  reject?: RejectCallback;
  show?: boolean;
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
    modalsOpenRaw.value[idx].props.show = false;
    nextTick(() => {
      modalsOpenRaw.value.splice(idx, 1);
    });
  }

  function openModal(name: string, props: IModalProps = {}): Promise<any> {
    const modalSettings = modalsRegistered.get(name);

    if (!modalSettings) {
      return Promise.reject(new Error(`Modal with name "${name}" not registered`));
    }

    const inPopup = IN_FRAME && IS_WEB && !!modalSettings.showInPopupIfWebFrame;
    const key = currentIndex + 1;
    currentIndex += 1;

    const modalPromise = new Promise((resolve, reject) => {
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
    title?: string | TranslateResult;
    msg?: string | TranslateResult;
    icon?: StatusIconType;
    buttonMessage?: string | TranslateResult;
    textCenter?: boolean;
  }) {
    return openModal(MODAL_DEFAULT, options);
  }

  function openErrorModal(entry: Record<string, any>) {
    return openModal(MODAL_ERROR_LOG, { entry }).catch(handleUnknownError);
  }

  return {
    modalsOpen,
    registerModal,
    openModal,
    openDefaultModal,
    openErrorModal,
    closeModalByKey,
  };
}
