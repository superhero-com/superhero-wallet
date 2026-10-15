import type { Runtime } from 'webextension-polyfill';
import type { ISidePanelRequest, PopupType, SidePanelMessage } from '@/types';
import {
  CONNECTION_TYPES,
  IN_FRAME,
  IS_SIDE_PANEL,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_MESSAGE_SIGN,
  POPUP_ACTIONS,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
} from '@/constants';
import { useAccounts, useAuth, useModals } from '@/composables';
import { sleep, watchUntilTruthy } from '@/utils';

const POPUP_MODALS: Record<PopupType, string> = {
  [POPUP_TYPE_CONNECT]: MODAL_CONFIRM_CONNECT,
  [POPUP_TYPE_ACCOUNT_LIST]: MODAL_CONFIRM_ACCOUNT_LIST,
  [POPUP_TYPE_SIGN]: MODAL_CONFIRM_TRANSACTION_SIGN,
  [POPUP_TYPE_RAW_SIGN]: MODAL_CONFIRM_RAW_SIGN,
  [POPUP_TYPE_MESSAGE_SIGN]: MODAL_MESSAGE_SIGN,
  [POPUP_TYPE_UNSAFE_SIGN]: MODAL_CONFIRM_UNSAFE_SIGN,
};

const RECONNECT_DELAY = 1000;
/** Longer than a double click, which would otherwise confirm the next request too. */
const NEXT_CONFIRMATION_DELAY = 500;

/**
 * Shows the dapp confirmations in the side panel while its browser window is focused,
 * instead of the popup windows the background opens.
 */
export const SidePanelConnection = (() => {
  // The modals share the popup props, so only one can be open at a time.
  let queue: Promise<unknown> = Promise.resolve();

  async function showConfirmation(
    port: Runtime.Port,
    isConnected: () => boolean,
    { id, popupType, props }: ISidePanelRequest,
  ) {
    const { openModal } = useModals();
    const { isAuthenticated } = useAuth();
    const { isLoggedIn } = useAccounts();

    await watchUntilTruthy(() => isLoggedIn.value && isAuthenticated.value);
    if (!isConnected()) {
      return;
    }

    let answer: SidePanelMessage;
    try {
      const payload = await openModal(POPUP_MODALS[popupType], {
        ...props,
        isOffscreenRequest: true,
      });
      answer = { id, type: POPUP_ACTIONS.resolve, payload };
    } catch {
      answer = { id, type: POPUP_ACTIONS.reject };
    }
    if (isConnected()) {
      port.postMessage(answer);
    }
  }

  async function connect() {
    const { id: windowId } = await browser.windows.getCurrent();
    const port = browser.runtime.connect({ name: CONNECTION_TYPES.SIDE_PANEL });
    let connected = true;
    // Chrome keeps the panel alive, but hidden, while another side panel is shown.
    const sendVisibility = () => port.postMessage({
      windowId,
      visible: document.visibilityState === 'visible',
    } as SidePanelMessage);

    port.onMessage.addListener((request: ISidePanelRequest) => {
      queue = queue
        .then(() => showConfirmation(port, () => connected, request))
        .then(() => sleep(NEXT_CONFIRMATION_DELAY))
        .catch(() => {});
    });
    // The offscreen document is not there yet or was reloaded.
    port.onDisconnect.addListener(() => {
      connected = false;
      document.removeEventListener('visibilitychange', sendVisibility);
      setTimeout(connect, RECONNECT_DELAY);
    });
    document.addEventListener('visibilitychange', sendVisibility);
    sendVisibility();
  }

  function init() {
    if (IS_SIDE_PANEL && !IN_FRAME) {
      connect();
    }
  }

  return {
    init,
  };
})();
