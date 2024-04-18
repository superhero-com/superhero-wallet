import { v4 as uuid } from 'uuid';
import type {
  Dictionary,
  IPopupProps,
  PopupType,
} from '@/types';

interface IPopupConfigNoActions {
  id: string;
  props: Omit<IPopupProps, 'resolve' | 'reject'>;
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

const popups: Dictionary<IPopupConfigNoActions> = {};

export const getAeppUrl = (v: any) => new URL(v.connection.port.sender.url);

export const openPopup = async (
  popupType: PopupType,
  aepp: string | object,
  params: Partial<IPopupProps> = {},
) => {
  const id = uuid();
  const { href, protocol, host } = (typeof aepp === 'object') ? getAeppUrl(aepp) : new URL(aepp);
  const { name = host } = (typeof aepp === 'object') ? aepp : {} as any;

  const tabs = await browser.tabs.query({ active: true });

  tabs.forEach(({ url: tabURL, id: tabId }) => {
    const tabUrl = new URL(tabURL as string);
    if (
      tabUrl.searchParams.get('type') === POPUP_TYPE_CONNECT
      && decodeURIComponent(tabUrl.searchParams.get('url') || '') === href
    ) {
      browser.tabs.remove(tabId as number);
    }
  });

  const extUrl = browser.runtime.getURL('./index.html');
  const popupUrl = `${extUrl}?id=${id}&type=${popupType}&url=${encodeURIComponent(href)}`;
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

  popups[id] = {
    id,
    props: {
      app: {
        url: href,
        name,
        protocol,
        host,
      },
      message: params.message,
      tx: params.tx,
      txBase64: params.txBase64,
      data: params.data,
    },
  };
  return popups[id];
};

export const removePopup = (id: string) => delete popups[id];

export const getPopup = (id: string): IPopupConfigNoActions => popups[id];
