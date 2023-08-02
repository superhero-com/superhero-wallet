import { CONNECTION_TYPES, IS_FIREFOX } from '@/config';

export const detectConnectionType = (port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port.sender.url.split('?');
  const isExtensionSender = senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX;
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};
