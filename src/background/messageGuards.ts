import type { Runtime } from 'webextension-polyfill';

export function isExtensionPageSender(sender: Runtime.MessageSender | undefined): boolean {
  // Not the id: Firefox extension URLs use a per-install UUID.
  return !!sender?.url?.startsWith(browser.runtime.getURL(''));
}
