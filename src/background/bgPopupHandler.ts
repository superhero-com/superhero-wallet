import { v4 as uuid } from 'uuid';
import type { Tabs, Windows } from 'webextension-polyfill';
import { getHttpOrigin } from '@/lib/approvalSourceTab';
import { mutateSessionKey, SESSION_ENCRYPTION_KEY } from '@/lib/ExtensionSessionStorage';
import type {
  Dictionary,
  IAppData,
  IPopupProps,
  PopupType,
} from '@/types';

export interface IPopupConfigNoActions {
  id: string;
  detachedWindowId?: number;
  detachedTabId?: number;
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

const POPUP_TYPE_CONNECT = 'connectConfirm';
const POPUP_HEIGHT = 630;

const popups: Dictionary<IPopupConfigNoActions> = {};
let creatingDetachedWindows = 0;
let detachedWindowsCreated = 0;

const storageSession = (browser.storage as any)?.session;

/**
 * Whether the page asking is in the tab the user looks at in the window, so that its side
 * panel may show the request. Assumed for a request without a site and a WalletConnect
 * dapp, which runs elsewhere. Without the tab of the request, the site of the tab is
 * compared, unless its URL can't be read: a window shows it.
 */
function isAppInActiveTab(
  activeTab: Tabs.Tab | undefined,
  app: IAppData,
  popupProps: Partial<IPopupProps>,
) {
  if (popupProps.app?.originSource === 'self-reported' || (!app.href && !popupProps.topLevelOrigin)) {
    return true;
  }
  if (popupProps.tabId !== undefined) {
    if (activeTab?.id !== popupProps.tabId) return false;
    const { topLevelOrigin } = popupProps;
    return !topLevelOrigin || (
      getHttpOrigin(activeTab.url) === topLevelOrigin
      && (!activeTab.pendingUrl || getHttpOrigin(activeTab.pendingUrl) === topLevelOrigin)
    );
  }
  if (!activeTab?.url || !app.href) {
    return false;
  }
  try {
    return new URL(activeTab.url).origin === new URL(app.href).origin;
  } catch {
    return false;
  }
}

function getPopupPosition(parent: Windows.Window | undefined, popupWidth: number) {
  if (!parent?.focused || parent.type !== 'normal'
    || (parent.state !== 'normal' && parent.state !== 'maximized')) return undefined;

  const {
    left = NaN, top = NaN, width = 0, height = 0,
  } = parent;
  const popupLeft = left + (width - popupWidth);
  if (![left, top, width, height, popupLeft].every(Number.isSafeInteger)
    || width < popupWidth || height < POPUP_HEIGHT) return undefined;

  return { left: popupLeft, top };
}

function getPopupQuery(popupUrlPrefix: string, url?: string) {
  return url?.startsWith(popupUrlPrefix) ? new URL(url).searchParams : undefined;
}

async function createDetachedWindow(
  url: string,
  width: number,
  position: ReturnType<typeof getPopupPosition>,
) {
  const options: Windows.CreateCreateDataType = {
    url, type: 'popup', width, height: POPUP_HEIGHT,
  };
  if (!position) return browser.windows.create(options);
  try {
    return await browser.windows.create({ ...options, ...position });
  } catch (error) {
    // Chromium rejects out-of-display bounds before opening the window.
    if (error instanceof Error && error.message.startsWith('Invalid value for bounds.')) {
      return browser.windows.create(options);
    }
    throw error;
  }
}

export const openPopup = async (
  popupType: PopupType,
  aepp: string | Record<string, any> | undefined, // TODO establish correct type for the object
  popupProps: Partial<IPopupProps> = {},
  sidePanelWindowIds: number[] = [],
  id = uuid(),
) => {
  let app: IAppData;

  if (typeof aepp === 'object') {
    app = new URL(aepp.connection.port.sender.url);
  } else if (aepp === undefined) {
    app = {} as IAppData;
  } else {
    app = new URL(aepp);
  }

  const createdBeforeQuery = detachedWindowsCreated;
  const [tabs, platform] = await Promise.all([
    browser.tabs.query({ active: true }).catch(() => undefined),
    IS_EXTENSION ? browser.runtime.getPlatformInfo().catch(() => null) : undefined,
  ]);
  const popupUrlPrefix = `${browser.runtime.getURL('index.html')}?`;
  let hasOpenPopupTab = tabs === undefined;
  tabs?.forEach(({ url, pendingUrl, id: tabId }) => {
    const currentQuery = getPopupQuery(popupUrlPrefix, url);
    // Open windows outlive a restart of the background worker.
    const queries = [currentQuery, getPopupQuery(popupUrlPrefix, pendingUrl)];
    if (queries.some((query) => query?.has('id') && query.has('type'))) {
      hasOpenPopupTab = true;
    }
    if (currentQuery?.get('type') === POPUP_TYPE_CONNECT && currentQuery.get('url') === app.href) {
      browser.tabs.remove(tabId as number);
    }
  });

  const { topLevelOrigin, ...approvalProps } = popupProps;
  const needsSourceTab = (!!app.href || !!topLevelOrigin)
    && popupProps.app?.originSource !== 'self-reported';
  // Firefox can place a popup off-screen on mixed-DPI Windows displays (bug 2089311).
  const isFirefoxOnWindows = platform?.os === 'win' && popupUrlPrefix.startsWith('moz-extension:');
  const canCheckPlacement = needsSourceTab && popupProps.tabId !== undefined && !!topLevelOrigin
    && !isFirefoxOnWindows && !hasOpenPopupTab && platform !== null;
  const focusedWindow = (sidePanelWindowIds.length || canCheckPlacement)
    ? await browser.windows.getLastFocused({ populate: needsSourceTab }).catch(() => undefined)
    : undefined;
  const activeTab = focusedWindow?.tabs?.find((tab) => tab.active);
  const matchesActiveTab = isAppInActiveTab(activeTab, app, popupProps);
  // A minimized window can still report itself as focused.
  const sidePanelWindowId = (
    focusedWindow?.focused
    && focusedWindow.state !== 'minimized'
    && sidePanelWindowIds.includes(focusedWindow.id!)
    && matchesActiveTab
  ) ? focusedWindow.id : undefined;

  let detachedWindowId: number | undefined;
  let detachedTabId: number | undefined;
  if (sidePanelWindowId === undefined) {
    const popupUrl = `${popupUrlPrefix}id=${id}&type=${popupType}&url=${encodeURIComponent(app.href!)}`;
    const width = platform?.os === 'mac' ? 360 : 375;
    // Another approval may have started after the active tabs were read.
    const canPosition = canCheckPlacement && matchesActiveTab
      && !creatingDetachedWindows && detachedWindowsCreated === createdBeforeQuery;
    const position = canPosition ? getPopupPosition(focusedWindow, width) : undefined;
    creatingDetachedWindows += 1;
    try {
      const popupWindow = await createDetachedWindow(popupUrl, width, position);
      if (popupWindow?.id === undefined) return null;
      detachedWindowId = popupWindow.id;
      detachedTabId = popupWindow.tabs?.[0]?.id;
      detachedWindowsCreated += 1;
    } finally {
      creatingDetachedWindows -= 1;
    }
  }

  popups[id] = {
    id,
    detachedWindowId,
    detachedTabId,
    sidePanelWindowId,
    props: {
      ...approvalProps,
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
let timeoutGeneration = 0;

/** `null` stops the timeout, e.g. while a wallet page is shown. */
export const setSessionTimeout = async (sessionTimeout: number | null) => {
  timeoutGeneration += 1;
  const generation = timeoutGeneration;
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
        await mutateSessionKey({ operation: 'clear' }, () => generation === timeoutGeneration);
      } finally {
        // A cancelled callback must not stop the newer session's keepalive.
        if (generation === timeoutGeneration) clearInterval(keepAliveInterval);
      }
    },
    sessionTimeout,
  );
};

export const getSessionEncryptionKey = async (): Promise<string | null> => {
  try {
    const { [SESSION_ENCRYPTION_KEY]: exportedEncryptionKey } = await storageSession.get(
      SESSION_ENCRYPTION_KEY,
    );
    if (exportedEncryptionKey) {
      return Buffer.from(exportedEncryptionKey).toString('base64');
    }
  } catch (error) { /** NOOP */ }

  return null;
};
