import { cloneDeep } from 'lodash-es';

const KEY = 'state';

const setState = async state => {
  await browser.storage.local.set({ [KEY]: cloneDeep(state) });
};

export const getState = async () => (await browser.storage.local.get(KEY))[KEY];

export default (reducerLoad, reducerSave) => async store => {
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
