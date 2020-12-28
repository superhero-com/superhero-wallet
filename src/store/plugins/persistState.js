import { cloneDeep, isEqual } from 'lodash-es';
import { detect } from 'detect-browser';

const KEY = 'state';

const setState = (state) =>
  browser.storage.local.set({ [KEY]: detect().name === 'firefox' ? cloneDeep(state) : state });

const getStateRaw = async () => (await browser.storage.local.get(KEY))[KEY];

// TODO: Avoid direct localStorage access outside of this module
export const getState = async () => (await getStateRaw()) || {};

const saverName =
  process.env.IS_EXTENSION && (window.IS_EXTENSION_BACKGROUND ? 'background' : 'popup');

export default (
  reducerLoad = (state) => state || {},
  reducerSave = ({ isRestored, ...state }) => state,
) => async (store) => {
  const { persistStateSavedBy: _, ...loadedState } = await reducerLoad(await getStateRaw());
  store.replaceState({
    ...store.state,
    ...loadedState,
    isRestored: true,
  });
  let lastState = reducerSave(cloneDeep(store.state));

  const dontSaveState = store.subscribe(async (mutation, state) => {
    const stateToSave = cloneDeep(reducerSave(state));
    if (isEqual(stateToSave, lastState)) return;
    lastState = stateToSave;
    await setState({ ...stateToSave, ...(saverName && { persistStateSavedBy: saverName }) });
  });

  if (process.env.IS_EXTENSION) {
    browser.storage.onChanged.addListener((changes, areaName) => {
      const rawState = changes[KEY]?.newValue;
      if (areaName !== 'local' || !rawState) return;
      const { persistStateSavedBy, ...newState } = rawState;
      if (persistStateSavedBy === saverName) return;
      store.replaceState({ ...store.state, ...cloneDeep(newState) });
      lastState = newState;
    });
  }

  if (!window.IS_EXTENSION_BACKGROUND) {
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
  }
};
