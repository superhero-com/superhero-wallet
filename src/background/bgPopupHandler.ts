import { v4 as uuid } from 'uuid';
import type {
  Dictionary,
  IAppData,
  IPopupProps,
  PopupType,
} from '@/types';

interface IPopupConfigNoActions {
  id: string;
  props: Omit<IPopupProps, 'resolve' | 'reject'>;
  /** Set when the side panel of this window shows the popup instead. */
  sidePanelWindowId?: number;
}

/**
 * We need to duplicate these constants here because
 * importing from constants.ts causes error in background script
 * due to undefined window object
 * (it cannot be present in background script & will throw an error when installing the extension)
 */
const PLATFORM = process.env.PLATFORM as 'web' | 'extension' | 'ionic';
const RUNNING_IN_TESTS = !!process.env.RUNNING_IN_TESTS;
const IS_EXTENSION = PLATFORM === 'extension' && !RUNNING_IN_TESTS;

const SESSION_STORAGE_KEYS = {
  exportedEncryptionKey: 'exportedEncryptionKey',
};

const POPUP_TYPE_CONNECT = 'connectConfirm';

const popups: Dictionary<IPopupConfigNoActions> = {};

const storageSession = (browser.storage as any)?.session;

/**
 * Whether the page asking is in the tab the user looks at in the window, so that its side
 * panel may show the request. Assumed for a request without a site and a WalletConnect
 * dapp, which runs elsewhere. Without the tab of the request, the site of the tab is
 * compared, unless its URL can't be read: a window shows it.
 */
async function isAppInActiveTab(
  windowId: number,
  app: IAppData,
  popupProps: Partial<IPopupProps>,
) {
  if (!app.href || popupProps.app?.originSource === 'self-reported') {
    return true;
  }
  const [activeTab] = await browser.tabs.query({ active: true, windowId });
  // A page in a frame asks with the site of the frame
  if (popupProps.tabId !== undefined) {
    return activeTab?.id === popupProps.tabId;
  }
  if (!activeTab?.url) {
    return false;
  }
  try {
    return new URL(activeTab.url).origin === new URL(app.href).origin;
  } catch {
    return false;
  }
}

export const openPopup = async (
  popupType: PopupType,
  aepp: string | Record<string, any> | undefined, // TODO establish correct type for the object
  popupProps: Partial<IPopupProps> = {},
  sidePanelWindowIds: number[] = [],
) => {
  const id = uuid();

  let app: IAppData;

  if (typeof aepp === 'object') {
    app = new URL(aepp.connection.port.sender.url);
  } else if (aepp === undefined) {
    app = {} as IAppData;
  } else {
    app = new URL(aepp);
  }

  const tabs = await browser.tabs.query({ active: true });

  tabs.forEach(({ url: tabURL, id: tabId }) => {
    const tabUrl = new URL(tabURL as string);
    if (
      tabUrl.searchParams.get('type') === POPUP_TYPE_CONNECT
      && decodeURIComponent(tabUrl.searchParams.get('url') || '') === app.href
    ) {
      browser.tabs.remove(tabId as number);
    }
  });

  const focusedWindow = sidePanelWindowIds.length
    ? await browser.windows.getLastFocused()
    : undefined;
  // `focused` stays true for a minimized window.
  // A request of a tab in the background gets a window, as the side panel shows another site.
  const sidePanelWindowId = (
    focusedWindow?.focused
    && focusedWindow.state !== 'minimized'
    && sidePanelWindowIds.includes(focusedWindow.id!)
    && await isAppInActiveTab(focusedWindow.id!, app, popupProps)
  ) ? focusedWindow.id : undefined;

  if (sidePanelWindowId === undefined) {
    const extUrl = browser.runtime.getURL('./index.html');
    const popupUrl = `${extUrl}?id=${id}&type=${popupType}&url=${encodeURIComponent(app.href!)}`;
    const isMacOsExtension = IS_EXTENSION && browser.runtime.getPlatformInfo().then(({ os }) => os === 'mac');

    const popupWindow = await browser.windows.create({
      url: popupUrl,
      type: 'popup',
      height: 630,
      width: await isMacOsExtension ? 360 : 375,
    });

    if (!popupWindow) {
      return null;
    }
  }

  popups[id] = {
    id,
    sidePanelWindowId,
    props: {
      ...popupProps,
      app: {
        href: app.href,
        name: app.name || app.host,
        protocol: app.protocol,
        host: app.host,
        ...(popupProps.app?.originSource ? { originSource: popupProps.app.originSource } : {}),
      },
    },
  };
  return popups[id];
};

export const removePopup = (id: string) => delete popups[id];

export const getPopup = (id: string): IPopupConfigNoActions => popups[id];

let expirationTimeout: NodeJS.Timeout;
let keepAliveInterval: NodeJS.Timeout;

/** `null` stops the timeout, e.g. while a wallet page is shown. */
export const setSessionTimeout = async (sessionTimeout: number | null) => {
  if (expirationTimeout) {
    clearTimeout(expirationTimeout);
  }
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  /**
   * Keeps the service worker, or Firefox's event page, alive. Idle for 30 seconds it would be
   * terminated with the timeout and, on Firefox, the count of shown pages.
   * https://stackoverflow.com/a/66618269
   */
  keepAliveInterval = setInterval(browser.runtime.getPlatformInfo, 20000);
  if (sessionTimeout === null) {
    return;
  }
  expirationTimeout = setTimeout(
    async () => {
      try {
        await storageSession.remove(SESSION_STORAGE_KEYS.exportedEncryptionKey);
      } finally {
        clearInterval(keepAliveInterval);
      }
    },
    sessionTimeout,
  );
};

export const getSessionEncryptionKey = async (): Promise<string | null> => {
  try {
    const { exportedEncryptionKey } = await storageSession.get(
      SESSION_STORAGE_KEYS.exportedEncryptionKey,
    );
    if (exportedEncryptionKey) {
      return Buffer.from(exportedEncryptionKey).toString('base64');
    }
  } catch (error) { /** NOOP */ }

  return null;
};
