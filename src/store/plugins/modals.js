import Promise from 'bluebird';

const modals = {};
let modalCounter = 0;

export const registerModal = ({ name, component, hidePage = false, allowRedirect = false, dontGrayscalePage = false }) => {
  if (modals[name]) throw new Error(`Modal with name "${name}" already registered`);
  modals[name] = {
    component,
    hidePage,
    allowRedirect,
    grayscalePage: !dontGrayscalePage,
  };
};

export default store => {
  store.registerModule('modals', {
    namespaced: true,
    state: { opened: [] },
    getters: {
      opened: ({ opened }) =>
        opened.map(({ name, ...other }) => ({ ...modals[name], ...other })).reduceRight((acc, modal) => (acc.length && acc[0].hidePage ? acc : [modal, ...acc]), []),
    },
    mutations: {
      open(state, modal) {
        state.opened.push(modal);
        console.log(state);
        console.log(modals);
      },
      closeByKey(state, key) {
        const idx = state.opened.findIndex(modal => modal.key === key);
        state.opened.splice(idx, 1);
      },
    },
    actions: {
      open({ commit }, { name, allowRedirect, ...props }) {
        console.log("open");
        console.log(name);
        if (!modals[name]) return Promise.reject(new Error(`Modal with name "${name}" not registered`));
        const key = modalCounter;
        modalCounter += 1;
        return new Promise((resolve, reject) =>
          commit('open', {
            name,
            key,
            allowRedirect,
            props: { ...props, resolve, reject },
          }),
        ).finally(() => commit('closeByKey', key));
      },
    }
  });
};
