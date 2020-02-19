import { postMessage } from './connection';

export default async () => {
  let resolved = false;

  const resolve = (payload = '') => postMessage({ type: 'ACTION_ACCEPT', payload });
  const reject = (payload = '') => postMessage({ type: 'ACTION_DENY', payload });

  const unloadHandler = () => {
    if (!resolved) {
      reject();
      if (window.hasOwnProperty('reject')) window.reject(new Error('Rejected by user'));
    }
  };
  window.addEventListener('beforeunload', unloadHandler, true);

  const closingWrapper = f => (...args) => {
    resolved = true;
    window.removeEventListener('beforeunload', unloadHandler, true);
    f(...args);
    window.close();
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const props = await postMessage({ type: 'POPUP_INFO' });
  props.resolve = closingWrapper(resolve);
  props.reject = closingWrapper(reject);
  return props;
};
