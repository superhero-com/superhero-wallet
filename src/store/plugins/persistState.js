import { cloneDeep, isEqual } from 'lodash-es';
import stateReducer from '@/store/utils';
import {
  PLATFORM,
  IS_EXTENSION,
  IS_EXTENSION_BACKGROUND,
  IS_FIREFOX,
} from '@/config';

const KEY = 'state';

const setState = (state) => browser.storage.local.set({
  [KEY]: IS_FIREFOX ? cloneDeep(state) : state,
});

const getStateRaw = async () => (await browser.storage.local.get(KEY))[KEY];

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
          // eslint-disable-next-line no-param-reassign
          .forEach(([name, value]) => { store.state[name] = value; });
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
