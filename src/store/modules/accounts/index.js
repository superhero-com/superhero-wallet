import hdWallet from './hdWallet';

// TODO: modules file is an object, because previously it contained more than one module,
// should be improved in the future
const modules = { hdWallet };

export default {
  namespaced: true,
  modules,

  actions: {
    sign({ dispatch }, { data, options }) {
      return dispatch('hdWallet/sign', { data, options });
    },

    signTransaction({ dispatch }, { txBase64, options }) {
      if (options && options.fromAccount) {
        return dispatch('hdWallet/signTransactionFromAccount', { txBase64, options });
      }
      return dispatch('hdWallet/signTransaction', { txBase64, options });
    },
  },
};
