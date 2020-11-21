import { cloneDeep } from 'lodash-es';
import { detect } from 'detect-browser';

const KEY = 'state';

const setState = (state) =>
  browser.storage.local.set({ [KEY]: detect().name === 'firefox' ? cloneDeep(state) : state });

export const getState = async () => (await browser.storage.local.get(KEY))[KEY];

export default (reducerLoad, reducerSave) => async (store) => {
  store.commit('setState', {
    ...(await reducerLoad(await getState())),
    isRestored: true,
  });
  store.subscribe((mutation, state) => setState(reducerSave(state)));
  store.registerModule('persistState', {
    actions: {
      async reset() {
        store.commit('resetState');
        await browser.storage.local.remove('errorLog');
      },
    },
  });
};
