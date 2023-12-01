import { CONNECTION_TYPES, IS_FIREFOX } from '@/constants';
import type { Runtime } from 'webextension-polyfill';
import { PopupMessageData } from '..';

export const detectConnectionType = (port: Runtime.Port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port?.sender?.url?.split('?')!;
  const isExtensionSender = senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX;
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};

export async function sendMessageToBackground(method: PopupMessageData['method'], params: PopupMessageData['params']) {
  return browser.runtime.sendMessage<PopupMessageData>({
    target: 'background',
    method,
    params,
  });
}
