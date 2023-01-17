export default (store) => {
  let tippingV1;
  let tippingV2;

  store.registerModule('tippingPlugin', {
    namespaced: true,
    state: {
      ready: false,
    },
    getters: {
      tippingV1: ({ ready }) => (ready ? tippingV1 : undefined),
      tippingV2: ({ ready }) => (ready ? tippingV2 : undefined),
    },
    mutations: {
      setTippingReady(state) {
        state.ready = true;
      },
    },
    actions: {
      async initialize({ commit }, [contractInstanceV1, contractInstanceV2]) {
        if (tippingV1 && tippingV2) return;

        tippingV1 = contractInstanceV1;
        tippingV2 = contractInstanceV2;
        commit('setTippingReady');
      },
    },
  });
};
