import { cloneDeep } from 'lodash-es';

const KEY = 'state';

const setState = async state => {
  browser.storage.local.set({ [KEY]: cloneDeep(state) });
};

export const getState = async () => {
  const { [KEY]: state } = await browser.storage.local.get(KEY);
  return state || {};
};

export const resetState = () => {
  browser.storage.remove.local(KEY);
};

export default (reducerLoad, reducerSave) => async store => {
  let resetting = false;
  let lastEmitedState = reducerLoad(await getState(), store);
  store.commit('syncState', lastEmitedState);
  store.subscribe(({ type, payload }, state) => {
    if (resetting || (type === 'syncState' && payload === lastEmitedState)) return;
    setState(reducerSave(state));
  });
  store.registerModule('persistState', {
    actions: {
      reset() {
        resetting = true;
        resetState();
      },
    },
  });
  if (process.env.IS_EXTENSION) {
    browser.storage.onChanged.addListener(async () => {
      lastEmitedState = reducerLoad(await getState(), store);
      store.commit('syncState', lastEmitedState);
    });
  } else {
    window.addEventListener('storage', async () => {
      lastEmitedState = reducerLoad(await getState(), store);
      store.commit('syncState', lastEmitedState);
    });
  }
};
