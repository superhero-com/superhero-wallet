export default {
  migrate(state, store) {
    return new Promise(async resolve => {
      const {
        commit,
        state: { network },
      } = store;
      const networks = {
        ...network,
        ...state.userNetworks.reduce((p, n) => ({ ...p, [n.name]: { ...n } }), {}),
      };

      const { networkId } = networks[state.current.network];
      setTimeout(() => {
        state.subaccounts.forEach(({ aename, publicKey }) => {
          if (aename) commit('names/setDefault', { address: publicKey, name: aename, networkId });
        });
        resolve();
      }, 1000);
    });
  },
};
