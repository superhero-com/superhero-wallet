import { postMessage } from './connection';

export default async () => {
  let resolved = false;

  const resolve = async (payload = '') => postMessage({ type: 'ACTION_ACCEPT', payload });
  const reject = async (payload = '') => postMessage({ type: 'ACTION_DENY', payload });

  const unloadHandler = () => {
    if (!resolved) {
      reject();
      if (window.reject) window.reject(new Error('Rejected by user'));
    }
  };
  window.addEventListener('beforeunload', unloadHandler, true);

  const closingWrapper = (f) => async (...args) => {
    resolved = true;
    window.removeEventListener('beforeunload', unloadHandler, true);
    if (process.env.RUNNING_IN_TESTS) {
      window[f.name] = await f(...args);
    } else {
      f(...args);
    }
    window.close();
    setTimeout(() => {
      window.close();
    }, 1000);
  };
  const payload = process.env.RUNNING_IN_TESTS
    ? { popupType: window.POPUP_TYPE, txType: (await browser.storage.local.get('txType')).txType }
    : {};
  const props = await postMessage({ type: 'POPUP_INFO', payload });
  props.resolve = closingWrapper(resolve);
  props.reject = closingWrapper(reject);
  return props;
};
