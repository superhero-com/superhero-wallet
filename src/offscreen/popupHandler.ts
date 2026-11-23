import '../lib/initPolyfills';
import { v4 as uuid } from 'uuid';
import type { Runtime } from 'webextension-polyfill';
import type { IPopupConfigNoActions } from '@/background/bgPopupHandler';
import type {
  Dictionary,
  IBackgroundMessageData,
  IPopupProps,
  ISidePanelRequest,
  PopupType,
  SidePanelMessage,
} from '@/types';
import { POPUP_ACTIONS, POPUP_METHODS, SESSION_METHODS } from '@/constants';
import { ApprovalWindowError } from '@/lib/errors';
import { executeOrSendMessageToBackground } from './utils';

interface IPopupConfig extends IPopupConfigNoActions {
  actions: Pick<IPopupProps, 'resolve' | 'reject'>;
  popupPort?: Runtime.Port;
  sidePanel?: Runtime.Port;
}

const popups: Dictionary<IPopupConfig> = Object.create(null);
const opening = new Map<string, {
  config: Promise<IPopupConfigNoActions | null>;
  closedWindows: Set<number>;
}>();

/** Ports of the open side panels by their browser window id. */
const sidePanels = new Map<number, Runtime.Port>();

export const removePopup = async (id: string) => {
  delete popups[id];
  executeOrSendMessageToBackground(POPUP_METHODS.removePopup, { id });
};

export const getPopup = (id: string) => popups[id];

/** A connected page settles its request through its port instead. */
function checkClosedWindow(id: string) {
  const popup = getPopup(id);
  if (popup?.detachedWindowId === undefined || popup.popupPort) return;
  popup.actions.reject();
  removePopup(id);
}

export function handlePopupWindowRemoved(windowId: number) {
  opening.forEach(({ closedWindows }) => closedWindows.add(windowId));
  Object.values(popups).forEach((popup) => {
    if (popup.detachedWindowId === windowId) checkClosedWindow(popup.id);
  });
}

async function bindPopupPort(id: string, port: Runtime.Port) {
  const pending = opening.get(id);
  if (pending) await pending.config;
  const popup = getPopup(id);
  const tab = port.sender?.tab;
  if (!popup || popup.popupPort || !tab) return undefined;
  const isExpectedTab = popup.detachedTabId !== undefined
    ? popup.detachedTabId === tab.id
    : popup.detachedWindowId !== undefined && popup.detachedWindowId === tab.windowId;
  if (!isExpectedTab) return undefined;
  popup.popupPort = port;
  return popup;
}

export function addPopupPort(port: Runtime.Port) {
  const { url, frameId } = port.sender ?? {};
  if (url?.split('?')[0] !== browser.runtime.getURL('index.html') || (frameId ?? 0) !== 0) return;
  const id = new URL(url).searchParams.get('id');
  const ready = id ? bindPopupPort(id, port) : undefined;
  let disconnected = false;
  port.onMessage.addListener(async (msg: IBackgroundMessageData) => {
    const popup = await ready;
    if (msg.type === POPUP_ACTIONS.getProps) {
      if (!disconnected) port.postMessage({ uuid: msg.uuid, res: popup?.props });
    } else if (msg.type === POPUP_ACTIONS.resolve || msg.type === POPUP_ACTIONS.reject) {
      popup?.actions[msg.type](msg.payload);
    }
  });
  port.onDisconnect.addListener(async () => {
    disconnected = true;
    const popup = await ready;
    if (popup) {
      popup.actions.reject();
      removePopup(popup.id);
    }
  });
}

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object | undefined,
  popupProps: Partial<IPopupProps> = {},
) => {
  const requestId = uuid();
  const config = executeOrSendMessageToBackground(POPUP_METHODS.openPopup, {
    id: requestId,
    popupProps,
    popupType,
    aepp,
    sidePanelWindowIds: [...sidePanels.keys()],
  }).catch(() => null) as Promise<IPopupConfigNoActions | null>;
  // A fast popup page or window removal can arrive before the creation reply.
  const closedWindows = new Set<number>();
  opening.set(requestId, { config, closedWindows });
  const popupConfig = await config;
  opening.delete(requestId);
  if (!popupConfig || popupConfig.id !== requestId) throw new ApprovalWindowError();

  // The confirmation modal chooses the result, e.g. which account to sign with.
  return new Promise<any>((resolve, reject) => {
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
      const { detachedWindowId } = popupConfig;
      if (detachedWindowId !== undefined && closedWindows.has(detachedWindowId)) {
        // A port already awaiting this config gets its queued answer first.
        queueMicrotask(() => checkClosedWindow(id));
      }
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
      reject(new ApprovalWindowError());
    }
  });
};

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
