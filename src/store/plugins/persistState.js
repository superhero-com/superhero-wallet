import Vue from 'vue';
import { cloneDeep, isEqual } from 'lodash-es';
import stateReducer from '../utils';
import {
  PLATFORM,
  IS_EXTENSION,
  IS_EXTENSION_BACKGROUND,
  IS_FIREFOX,
} from '../../lib/environment';
import { walletStorage } from '../../popup/utils';

const KEY = 'state';

/**
 * With the introduction of common storage solution: `walletStorage`
 * we need to rename the storage state key as we are now prefixing all storage keys.
 */
const moveOldStateToNewScope = async () => {
  const oldState = (await browser.storage.local.get(KEY))[KEY];
  if (oldState) {
    await walletStorage.set(KEY, oldState);
    browser.storage.local.remove(KEY);
  }
};
const setState = (state) => walletStorage.set(KEY, IS_FIREFOX ? cloneDeep(state) : state);
const getStateRaw = async () => {
  await moveOldStateToNewScope();
  return walletStorage.get(KEY);
};

// TODO: Avoid direct localStorage access outside of this module
export const getState = async () => (await getStateRaw()) || {};

const saverName = IS_EXTENSION && (IS_EXTENSION_BACKGROUND ? 'background' : 'popup');

export default (
  reducerLoad = (state) => state || {},
  reducerSave = ({ isRestored, ...state }) => stateReducer(state),
) => async (store) => {
  let dontSaveState;

  store.registerModule('persistState', {
    actions: !IS_EXTENSION_BACKGROUND && {
      async reset() {
        dontSaveState();
        await browser.storage.local.clear();
        if (IS_EXTENSION) browser.runtime.sendMessage({ method: 'reload' });
        const location = {
          extension: './index.html',
          cordova: './index.html',
          web: '/',
        }[PLATFORM];
        if (!location) throw new Error('Unknown platform');
        window.location = location;
      },
    },
    mutations: {
      syncState(state, newState) {
        Object.entries(newState)
          .forEach(([name, value]) => Vue.set(store.state, name, value));
      },
    },
  });

  const { persistStateSavedBy: _, ...loadedState } = await reducerLoad(await getStateRaw());
  store.commit('syncState', { ...loadedState, isRestored: true });
  let lastState = reducerSave(cloneDeep(store.state));

  dontSaveState = store.subscribe(async (mutation, state) => {
    const stateToSave = cloneDeep(reducerSave(state));
    if (isEqual(stateToSave, lastState)) return;
    lastState = stateToSave;
    await setState({ ...stateToSave, ...(saverName && { persistStateSavedBy: saverName }) });
  });

  if (IS_EXTENSION) {
    browser.storage.onChanged.addListener((changes, areaName) => {
      const rawState = changes[KEY]?.newValue;
      if (areaName !== 'local' || !rawState) return;
      const { persistStateSavedBy, ...newState } = rawState;
      if (persistStateSavedBy === saverName) return;
      lastState = cloneDeep(newState);
      store.commit('syncState', newState);
    });
  }
};
