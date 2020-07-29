import { Universal, MemoryAccount, Crypto } from '@aeternity/aepp-sdk/es';

export default {
  namespaced: true,
  state: {
    invites: [],
  },
  mutations: {
    add: ({ invites }, secretKey) => invites.unshift({ secretKey, createdAt: Date.now() }),
  },
  actions: {
    async claim({ rootState: { account }, state: { invites }, dispatch }, idx) {
      const sdk = await dispatch('getClient', invites[idx].secretKey);
      try {
        sdk.transferFunds(1, account.publicKey, {
          payload: 'referral',
        });
      } catch (e) {
        if (e.message.includes('is not enough to execute')) {
          dispatch(
            'modals/open',
            { name: 'default', msg: this.$t('pages.invite.insufficient-balance') },
            { root: true },
          );
          return;
        }
        throw e;
      }
    },
    async getClient({ rootState: { network, current, sdk } }, secretKey) {
      const { compilerUrl } = network[current.network];
      const { instance } = sdk.pool.get(current.network);
      const accounts = MemoryAccount({
        keypair: {
          publicKey: Crypto.getAddressFromPriv(secretKey),
          secretKey,
        },
      });
      return Universal({
        compilerUrl,
        nodes: [{ name: current.network, instance }],
        accounts: [accounts],
      });
    },
  },
};
