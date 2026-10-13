import type { Runtime } from 'webextension-polyfill';
import type { IBackgroundMessageData } from '@/types';

export function isAcceptedOffscreenSender(
  msg: IBackgroundMessageData | undefined,
  sender: Runtime.MessageSender | undefined,
): boolean {
  return msg?.target === 'offscreen' && sender?.id === browser.runtime.id;
}

export function isExtensionPageSender(sender: Runtime.MessageSender | undefined): boolean {
  // Not the id: Firefox extension URLs use a per-install UUID.
  return !!sender?.url?.startsWith(browser.runtime.getURL(''));
}
