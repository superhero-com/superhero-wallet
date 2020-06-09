export default {
  migrate(state, store) {
    return new Promise(async resolve => {
      const {
        commit,
        state: { network },
      } = store;
      const networks = {
        ...network,
        ...(state.userNetworks || []).reduce((p, n) => ({ ...p, [n.name]: { ...n } }), {}),
      };
      const net = process.env.RUNNING_IN_TESTS ? 'Testnet' : state.current.network;
      const { networkId } = networks[net];
      setTimeout(() => {
        if (state.subaccounts) {
          state.subaccounts.forEach(({ aename, publicKey }) => {
            if (aename) commit('names/setDefault', { address: publicKey, name: aename, networkId });
          });
          resolve();
        }
      }, 1000);
    });
  },
};
