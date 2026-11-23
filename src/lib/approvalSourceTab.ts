import type { Runtime } from 'webextension-polyfill';
import type { IApprovalSourceTab } from '@/types';

export function getHttpOrigin(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol, origin } = new URL(url);
    return (protocol === 'https:' || protocol === 'http:') ? origin : undefined;
  } catch {
    return undefined;
  }
}

export function getApprovalSourceTab(sender?: Runtime.MessageSender): IApprovalSourceTab {
  const tabId = sender?.tab?.id;
  const topLevelUrl = sender?.frameId === 0 ? sender.url : sender?.tab?.url;
  return { tabId, topLevelOrigin: tabId === undefined ? undefined : getHttpOrigin(topLevelUrl) };
}
