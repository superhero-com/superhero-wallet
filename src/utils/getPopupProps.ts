import { v4 as genUuid } from 'uuid';
import type { Runtime } from 'webextension-polyfill';
import { Tag, unpackTx, buildTx as rawBuildTx } from '@aeternity/aepp-sdk';
import type {
  Dictionary,
  IPopupActions,
  IPopupData,
  IBackgroundMessageData,
  IPopupProps,
  TxType,
} from '@/types';
import { STUB_TX_PARAMS, STUB_POPUP_PROPS } from '@/constants/stubs';
import {
  CONNECTION_TYPES,
  IS_EXTENSION,
  POPUP_ACTIONS,
  POPUP_TYPE,
  RUNNING_IN_TESTS,
} from '@/constants';

export function buildTx(txType: TxType) {
  const params = {
    // TODO: Fix typecasting by defining individual types of each param
    ...STUB_TX_PARAMS[txType] as any,
    tag: Tag[txType],
  };
  return rawBuildTx(params);
}

const postMessage = (() => {
  const pendingRequests: Dictionary<IPopupActions> = {};
  let background: Runtime.Port;

  return async ({ type, payload }: IBackgroundMessageData): Promise<IPopupData | null> => {
    if (!IS_EXTENSION || !browser) {
      throw new Error('Supported only in browser extension');
    }

    if (!background) {
      background = browser.runtime.connect({ name: CONNECTION_TYPES.POPUP });
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

const postMessageTest = async ({ type }: IBackgroundMessageData): Promise<IPopupData | null> => {
  switch (type) {
    case POPUP_ACTIONS.getProps: {
      const { txType } = await browser.storage.local.get('txType');
      if (txType) {
        const props = STUB_POPUP_PROPS.base;
        props.tx = unpackTx(buildTx(txType as any)) as any;
        return props;
      }
      return POPUP_TYPE ? STUB_POPUP_PROPS[POPUP_TYPE] : {};
    }
    case POPUP_ACTIONS.resolve:
    case POPUP_ACTIONS.reject:
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
export async function getPopupProps(): Promise<IPopupProps> {
  const internalPostMessage = (RUNNING_IN_TESTS)
    ? postMessageTest
    : postMessage;

  let resolved = false;

  const resolve = async () => internalPostMessage({ type: POPUP_ACTIONS.resolve });
  const reject = async () => internalPostMessage({ type: POPUP_ACTIONS.reject });

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

  const popupProps = await internalPostMessage({ type: POPUP_ACTIONS.getProps });
  return {
    ...popupProps || {},
    resolve: closingWrapper(resolve),
    reject: closingWrapper(reject),
  };
}
