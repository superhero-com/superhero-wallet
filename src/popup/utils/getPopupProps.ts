import { v4 as genUuid } from 'uuid';
import { Tag, unpackTx, buildTx as rawBuildTx } from '@aeternity/aepp-sdk-13';
import type { Dictionary, IPopupConfig } from '../../types';
import { txParams, popupProps } from './testsConfig';
import { CONNECTION_TYPES } from './index';
import { IS_EXTENSION, POPUP_TYPE, RUNNING_IN_TESTS } from '../../lib/environment';
import '../../lib/initPolyfills';

// @ts-ignore
declare const browser: Browser;

interface PopupMessageData {
  type: 'resolve' | 'reject' | 'getProps'
  payload?: any
}

interface IPendingRequest {
  resolve: (res: any) => void;
  reject: () => void;
}

type PostMessageReturn = Promise<Partial<IPopupConfig> | null>;

export function buildTx(txType: keyof typeof Tag) {
  const params = {
    // TODO: Fix typecasting by defing individual types of each param
    ...txParams[txType] as any,
    tag: Tag[txType],
  };
  return rawBuildTx(params);
}

const postMessage = (() => {
  const pendingRequests: Dictionary<IPendingRequest> = {};
  let background: any;

  return async ({ type, payload }: PopupMessageData): PostMessageReturn => {
    if (!IS_EXTENSION || !browser) {
      throw new Error('Supported only in browser extension');
    }

    if (!background) {
      background = await browser.runtime.connect({ name: CONNECTION_TYPES.POPUP });
      background.onMessage.addListener(({ uuid, res }: any) => {
        if (!pendingRequests[uuid]) {
          throw new Error(`Can't find request with id: ${uuid}`);
        }
        pendingRequests[uuid].resolve(res);
        delete pendingRequests[uuid];
      });
    }

    const uuid = genUuid();
    background.postMessage({ type, payload, uuid });
    return new Promise((resolve, reject) => {
      pendingRequests[uuid] = { resolve, reject };
    });
  };
})();

const postMessageTest = async ({ type }: PopupMessageData): PostMessageReturn => {
  switch (type) {
    case 'getProps': {
      const { txType } = await browser.storage.local.get('txType');
      if (txType) {
        const props = popupProps.base as IPopupConfig;
        props.tx = unpackTx(buildTx(txType)) as any;
        return props;
      }
      return POPUP_TYPE ? popupProps[POPUP_TYPE] : {};
    }
    case 'resolve':
    case 'reject':
      (window as any)[type] = 'send';
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
  return null;
};

/**
 * Handle the communication between browser popup windows opened by the extension
 * and the extension itself.
 */
export default async () => {
  const internalPostMessage = (RUNNING_IN_TESTS)
    ? postMessageTest
    : postMessage;

  let resolved = false;

  const resolve = async () => internalPostMessage({ type: 'resolve' });
  const reject = async () => internalPostMessage({ type: 'reject' });

  const unloadHandler = () => {
    if (!resolved) {
      reject();
    }
  };
  window.addEventListener('beforeunload', unloadHandler, true);

  const closingWrapper = (callback: any) => async (...args: any) => {
    resolved = true;
    window.removeEventListener('beforeunload', unloadHandler, true);
    callback(...args);
    window.close();
    setTimeout(() => window.close(), 1000);
  };
  const props = (await internalPostMessage({ type: 'getProps' })) || {};
  props.resolve = closingWrapper(resolve);
  props.reject = closingWrapper(reject);
  return props;
};
