import type { Runtime } from 'webextension-polyfill';
import type { IBackgroundMessageData, BackgroundMethod } from '@/types';
import {
  CONNECTION_TYPES,
  IS_FIREFOX,
  POPUP_METHODS,
  SESSION_METHODS,
} from '@/constants';
import {
  openPopup,
  removePopup,
  getPopup,
  getSession,
} from '@/background/bgPopupHandler';
import { getCleanModalOptions } from '@/utils';

export const detectConnectionType = (port: Runtime.Port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port?.sender?.url?.split('?') || [];
  const isExtensionSender = (
    senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX
  );
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  } if (CONNECTION_TYPES.SESSION === port.name) {
    return CONNECTION_TYPES.SESSION;
  }
  return CONNECTION_TYPES.OTHER;
};

/**
 * If browser is FF we cannot send messaged to the background page
 * because we "are" on the background page
 * instead call the function directly from bgPopupHandler.ts
 */
export async function executeOrSendMessageToBackground(
  method: BackgroundMethod,
  params?: Required<IBackgroundMessageData>['params'],
) {
  if (IS_FIREFOX) {
    switch (method) {
      case POPUP_METHODS.openPopup:
        return openPopup(params?.popupType!, params?.aepp!, params?.popupProps);
      case POPUP_METHODS.removePopup:
        return removePopup(params?.id!);
      case POPUP_METHODS.getPopup:
        return getPopup(params?.id!);
      case SESSION_METHODS.getSessionKey:
        return getSession();
      default:
        return null;
    }
  }
  const cleanParams = getCleanModalOptions<typeof params>(params);
  return browser.runtime.sendMessage<IBackgroundMessageData>({
    target: 'background',
    method,
    params: cleanParams,
  });
}
