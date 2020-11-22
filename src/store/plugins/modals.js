import { IN_FRAME } from '../../popup/utils/helper';

const modals = {};
let modalCounter = 0;
let lastPopupPromise = Promise.resolve();
let popupWindow;

export const registerModal = ({ name, ...options }) => {
  if (modals[name]) throw new Error(`Modal with name "${name}" already registered`);
  modals[name] = options;
};

export default (store) => {
  store.registerModule('modals', {
    namespaced: true,
    state: { opened: [] },
    getters: {
      opened: ({ opened }) =>
        opened
          .filter(({ inPopup }) => !inPopup)
          .map(({ name, ...other }) => ({ ...modals[name], ...other })),
    },
    mutations: {
      open(state, modal) {
        state.opened.push(modal);
      },
      closeByKey(state, key) {
        const idx = state.opened.findIndex((modal) => modal.key === key);
        state.opened.splice(idx, 1);
      },
    },
    actions: {
      open({ commit }, { name, allowRedirect, ...props }) {
        if (!modals[name])
          return Promise.reject(new Error(`Modal with name "${name}" not registered`));
        if (props.msg === 'Rejected by user') return Promise.reject(new Error('Rejected by user')); // TODO: Move it to the corresponding modal
        const key = modalCounter;
        modalCounter += 1;

        const inPopup =
          process.env.PLATFORM === 'web' && IN_FRAME && modals[name].showInPopupIfWebFrame;

        const promise = new Promise((resolve, reject) => {
          commit('open', {
            name,
            key,
            inPopup,
            props: { ...props, resolve, reject },
          });

          if (!inPopup) return;
          if (popupWindow) popupWindow.focus();
          lastPopupPromise
            .catch(() => {})
            .finally(() => {
              popupWindow = window.open(
                `/web-iframe-popup/${name}`,
                `popup-${key}`,
                'height=600,width=375',
              );
              if (!popupWindow) reject(new Error("Can't show popup window"));
              else popupWindow.popupProps = { ...props, resolve, reject };
            });
        }).finally(() => commit('closeByKey', key));
        if (inPopup) lastPopupPromise = promise;
        return promise;
      },
    },
  });
};
