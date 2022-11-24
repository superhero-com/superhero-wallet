import { v4 as genUuid } from 'uuid';
import { popupProps } from './config';
import { buildTx, CONNECTION_TYPES } from './index';
import { IS_EXTENSION, POPUP_TYPE } from '../../lib/environment';
import '../../lib/initPolyfills';

interface PopupMessageData {
  type: 'resolve' | 'reject' | 'getProps'
  payload?: any
}

type PopupMessageProps = Record<string, any>;

const postMessage = (() => {
  const pendingRequests: Record<string, any> = {};
  let background: any;

  return async ({ type, payload }: PopupMessageData): Promise<PopupMessageProps> => {
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
      });
    }

    const uuid = genUuid();
    background.postMessage({ type, payload, uuid });
    return new Promise((resolve, reject) => {
      pendingRequests[uuid] = { resolve, reject };
    });
  };
})();

const postMessageTest = async ({ type }: PopupMessageData) => {
  switch (type) {
    case 'getProps': {
      const { txType } = await browser?.storage?.local?.get('txType');
      if (txType) {
        const props = popupProps.base as PopupMessageProps;
        props.transaction = buildTx(txType).txObject;
        return props;
      }
      return POPUP_TYPE ? (popupProps as any)[POPUP_TYPE] : {};
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

const internalPostMessage = (process.env.RUNNING_IN_TESTS)
  ? postMessageTest
  : postMessage;

export default async () => {
  let resolved = false;

  const resolve = async () => internalPostMessage({ type: 'resolve' });
  const reject = async () => internalPostMessage({ type: 'reject' });

  const unloadHandler = () => {
    if (resolved) return;
    reject();
  };
  window.addEventListener('beforeunload', unloadHandler, true);

  const closingWrapper = (f: any) => async (...args: any) => {
    resolved = true;
    window.removeEventListener('beforeunload', unloadHandler, true);
    f(...args);
    window.close();
    setTimeout(() => window.close(), 1000);
  };
  const props = await internalPostMessage({ type: 'getProps' });
  props.resolve = closingWrapper(resolve);
  props.reject = closingWrapper(reject);
  return props;
};
