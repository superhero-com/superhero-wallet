import { v4 as genUuid } from 'uuid';
import { IInternalPostMessageOptions } from '../../types';
import '../../lib/initPolyfills';

// eslint-disable-next-line no-unused-vars
type PostMessageFunction = (message: Record<string, any>, tab: any) => Promise<any>;

let internalPostMessage: any;
let contentPostMessage: PostMessageFunction | undefined;

const ensureBackgroundInitialised = async () => {
  if (!process.env.IS_EXTENSION) throw new Error('Supported only in browser extension');
  if (internalPostMessage) return;
  const background = await browser?.runtime.connect({ name: 'POPUP' });
  const pendingRequests: Record<string, any> = {};
  background.onMessage.addListener(({ uuid, res }: any) => {
    if (!pendingRequests[uuid]) {
      throw new Error(`Can't find request with id: ${uuid}`);
    }
    pendingRequests[uuid].resolve(res);
  });
  internalPostMessage = (message: Record<string, any>) => {
    const id = genUuid();
    background.postMessage({ ...message, uuid: id });
    return new Promise((resolve, reject) => {
      pendingRequests[id] = { resolve, reject };
    });
  };
};

export const postMessage = async ({ type, payload }: IInternalPostMessageOptions) => {
  await ensureBackgroundInitialised();
  return internalPostMessage({ type, payload });
};

export const ensureContentScriptInitialized = async () => {
  if (!process.env.IS_EXTENSION) throw new Error('Supported only in browser extension');
  if (contentPostMessage) return;
  const pendingMessages: Record<string, any> = {};
  browser!.runtime.onMessage.addListener(({ uuid, data }: any) => {
    if (!pendingMessages[uuid]) {
      throw new Error(`Can't find message with id: ${uuid}`);
    }
    pendingMessages[uuid].resolve(data);
  });
  contentPostMessage = async (message, tab) => {
    const id = genUuid();
    await browser!.tabs.sendMessage(tab, { data: { ...message, uuid: id } });
    return new Promise((resolve, reject) => {
      pendingMessages[id] = { resolve, reject };
    });
  };
};

export const postMessageToContent: PostMessageFunction = async (message, tab) => {
  await ensureContentScriptInitialized();
  return contentPostMessage ? contentPostMessage(message, tab) : null;
};
