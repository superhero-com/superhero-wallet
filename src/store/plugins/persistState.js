import { cloneDeep } from 'lodash-es';
import { detect } from 'detect-browser';

const KEY = 'state';

const setState = (state) =>
  browser.storage.local.set({ [KEY]: detect().name === 'firefox' ? cloneDeep(state) : state });

const getStateRaw = async () => (await browser.storage.local.get(KEY))[KEY];

// TODO: Avoid direct localStorage access outside of this module
export const getState = async () => (await getStateRaw()) || {};

export default (reducerLoad, reducerSave) => async (store) => {
  const loadedState = await reducerLoad(await getStateRaw());
  store.replaceState({
    ...store.state,
    ...loadedState,
    isRestored: true,
  });
  const dontSaveState = store.subscribe((mutation, state) => setState(reducerSave(state)));
  store.registerModule('persistState', {
    actions: {
      async reset() {
        dontSaveState();
        await browser.storage.local.clear();
        if (process.env.IS_EXTENSION) browser.runtime.sendMessage({ method: 'reload' });
        const location = {
          'extension-chrome': './popup.html',
          'extension-firefox': './popup.html',
          cordova: './index.html',
          web: '/',
        }[process.env.PLATFORM];
        if (!location) throw new Error('Unknown platform');
        window.location = location;
      },
    },
  });
};
