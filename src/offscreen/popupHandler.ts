import '../lib/initPolyfills';
import type { Runtime } from 'webextension-polyfill';
import type {
  Dictionary,
  IPopupProps,
  ISidePanelRequest,
  PopupType,
  SidePanelMessage,
} from '@/types';
import { POPUP_ACTIONS, POPUP_METHODS, SESSION_METHODS } from '@/constants';
import { executeOrSendMessageToBackground } from './utils';

interface IPopupConfig {
  id: string;
  actions: Pick<IPopupProps, 'resolve' | 'reject'>;
  props: Omit<IPopupProps, 'resolve' | 'reject'>;
  sidePanelWindowId?: number;
  sidePanel?: Runtime.Port;
}

const popups: Dictionary<IPopupConfig> = {};

/** Ports of the open side panels by their browser window id. */
const sidePanels = new Map<number, Runtime.Port>();

export const removePopup = async (id: string) => {
  delete popups[id];
  executeOrSendMessageToBackground(POPUP_METHODS.removePopup, { id });
};

export const getPopup = (id: string) => popups[id];

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object | undefined,
  popupProps: Partial<IPopupProps> = {},
) => executeOrSendMessageToBackground(
  POPUP_METHODS.openPopup,
  {
    popupProps,
    popupType,
    aepp,
    sidePanelWindowIds: [...sidePanels.keys()],
  },
)
  .then((popupConfig: IPopupConfig) => (
    // The resolution value comes from whatever the confirmation modal passes to
    // its `resolve` prop (e.g. the account the user chose to sign with), not
    // from `popupConfig`, so it can't be typed as `IPopupConfig`.
    new Promise<any>((resolve, reject) => {
      const { id, props, sidePanelWindowId } = popupConfig;
      const sidePanel = (sidePanelWindowId === undefined)
        ? undefined
        : sidePanels.get(sidePanelWindowId);
      popups[id] = {
        ...popupConfig,
        sidePanel,
        actions: { resolve, reject },
      };
      if (sidePanelWindowId === undefined) {
        return;
      }
      if (!sidePanel) {
        // The side panel was closed in the meantime.
        removePopup(id);
        resolve(openPopup(popupType, aepp, popupProps));
        return;
      }
      try {
        sidePanel.postMessage({ id, popupType, props } as ISidePanelRequest);
      } catch {
        // The port can't take the message: it is closed or the props don't clone.
        removePopup(id);
        reject();
      }
    })
  ));

/**
 * The side panel shows the popups of its browser window instead of popup windows.
 */
export function addSidePanel(port: Runtime.Port) {
  // Not hosted in a tab, unlike `index.html?sidepanel` opened by a web page.
  if (port.sender?.tab) {
    return;
  }
  let windowId: number | undefined;

  port.onMessage.addListener((msg: SidePanelMessage) => {
    if ('windowId' in msg) {
      if (windowId === undefined && typeof msg.windowId === 'number') {
        windowId = msg.windowId;
      }
      if (msg.windowId !== windowId) {
        return;
      }
      if (msg.visible) {
        sidePanels.set(windowId, port);
      } else if (sidePanels.get(windowId) === port) {
        sidePanels.delete(windowId);
      }
      return;
    }
    const popup = popups[msg.id];
    if (popup?.sidePanel !== port) {
      return;
    }
    if (msg.type === POPUP_ACTIONS.resolve) {
      popup.actions.resolve(msg.payload);
    } else {
      popup.actions.reject();
    }
    removePopup(msg.id);
  });

  port.onDisconnect.addListener(() => {
    if (windowId !== undefined && sidePanels.get(windowId) === port) {
      sidePanels.delete(windowId);
    }
    Object.values(popups)
      .filter(({ sidePanel }) => sidePanel === port)
      .forEach(({ id, actions }) => {
        actions.reject();
        removePopup(id);
      });
  });
}

export const getSessionEncryptionKey = async (): Promise<string | null> => (
  await executeOrSendMessageToBackground(SESSION_METHODS.getSessionEncryptionKey) as string | null
);
