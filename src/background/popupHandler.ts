import { v4 as uuid } from 'uuid';
import { Browser } from 'webextension-polyfill';
import { Dictionary } from '../types';
import {
  isTxOfASupportedType,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_RAW_SIGN,
} from '../popup/utils';

// @ts-ignore
declare const browser: Browser;

const popups: Dictionary = {};

export const getAeppUrl = (v: any) => new URL(v.connection.port.sender.url);

export const showPopup = async (aepp: any, type: string, params?: any) => {
  const id = uuid();
  const { href, protocol, host } = typeof aepp === 'object' ? getAeppUrl(aepp) : new URL(aepp);
  const tabs = await browser.tabs.query({ active: true });
  // @ts-ignore
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
  const isRawSign = type === POPUP_TYPE_SIGN && !isTxOfASupportedType(params?.tx, true);
  const popupType = isRawSign ? POPUP_TYPE_RAW_SIGN : type;
  const popupUrl = `${extUrl}?id=${id}&type=${popupType}&url=${encodeURIComponent(href)}`;

  const popupWindow = await browser.windows.create({
    url: popupUrl,
    type: 'popup',
    height: 600,
    width: 375,
  });

  return new Promise((resolve, reject) => {
    if (!popupWindow) reject();
    popups[id] = {
      actions: { resolve, reject },
      props: {
        app: {
          url: href,
          icons: aepp?.icons || [],
          name: aepp?.name || host,
          protocol,
          host,
        },
        ...(params?.message && { message: params.message }),
        ...(params?.txObject && !isRawSign && { tx: params.txObject }),
        ...(isRawSign && { data: params.tx }),
      },
    };
  });
};

export const removePopup = (id: string) => delete popups[id];

export const getPopup = (id: string) => popups[id];
