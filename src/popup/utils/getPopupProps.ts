import type { IInternalPostMessageOptions } from '../../types';
import { postMessage } from './connection';
import { popupProps } from './testsConfig';
import { buildTx, walletStorage } from './index';
import { POPUP_TYPE } from '../../lib/environment';

const internalPostMessage = process.env.RUNNING_IN_TESTS
  ? async ({ type }: IInternalPostMessageOptions) => {
    switch (type) {
      case 'getProps': {
        const { txType } = await walletStorage.get('txType') as any;
        if (txType) {
          const props = popupProps.base;
          props.transaction = buildTx(txType).txObject;
          return props;
        }
        return popupProps[POPUP_TYPE];
      }
      case 'resolve':
      case 'reject':
        (window as any)[type] = 'send';
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
    return null;
  }
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

  const closingWrapper = (f: any) => async (...args: any[]) => {
    resolved = true;
    window.removeEventListener('beforeunload', unloadHandler, true);
    f(...args);
    window.close();
    setTimeout(() => {
      window.close();
    }, 1000);
  };
  const props = await internalPostMessage({ type: 'getProps' });
  props.resolve = closingWrapper(resolve);
  props.reject = closingWrapper(reject);
  return props;
};
