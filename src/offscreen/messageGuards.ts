import type { Runtime } from 'webextension-polyfill';
import type { IBackgroundMessageData } from '@/types';

export function isAcceptedOffscreenSender(
  msg: IBackgroundMessageData | undefined,
  sender: Runtime.MessageSender | undefined,
): boolean {
  return msg?.target === 'offscreen' && sender?.id === browser.runtime.id;
}
