import { CONNECTION_TYPES, IS_FIREFOX } from '@/constants';
import type { Runtime } from 'webextension-polyfill';
import { openPopup, removePopup, getPopup } from '@/background/bgPopupHandler';
import { PopupMessageData } from '@/background';

export const detectConnectionType = (port: Runtime.Port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port?.sender?.url?.split('?')!;
  const isExtensionSender = (
    senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX
  );
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};

/**
 * Clean params from members that cause issues when sending messages
 */
function getCleanParams(params: PopupMessageData['params']) {
  const cleanedParams = { ...params };
  delete cleanedParams.params?.onCompiler;
  delete cleanedParams.params?.onNode;
  return cleanedParams;
}

/**
 * If browser is FF we cannot send messaged to the background page
 * because we "are" on the background page
 * instead call the function directly from bgPopupHandler.ts
 */
export async function executeOrSendMessageToBackground(method: PopupMessageData['method'], params: PopupMessageData['params']) {
  if (IS_FIREFOX) {
    switch (method) {
      case 'openPopup':
        return openPopup(params.popupType, params.aepp, params.params);
      case 'removePopup':
        return removePopup(params.id);
      case 'getPopup':
        return getPopup(params.id);
      default:
        return null;
    }
  }
  const cleanParams = getCleanParams(params);
  return browser.runtime.sendMessage<PopupMessageData>({
    target: 'background',
    method,
    params: cleanParams,
  });
}
