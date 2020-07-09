import Vue from 'vue';
import { Universal as Ae, Node, MemoryAccount } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';

export default {
  namespaced: true,
  state: {
    links: [],
    client: null,
  },
  mutations: {
    add(state, link) {
      state.links.unshift(link);
    },
    setClient(state, client) {
      state.client = client;
    },
    setBalance(state, { idx, balance }) {
      Vue.set(state.links[idx], 'balance', balance);
    },
  },
  actions: {
    async claim({ rootState: { account }, state: { links }, dispatch }, idx) {
      const { publicKey, secretKey } = links[idx];
      const sdk = await dispatch('getClient', { publicKey, secretKey });
      try {
        sdk.transferFunds(1, account.publicKey, {
          payload: 'referral',
        });
      } catch (e) {
        if (e.message.includes('is not enough to execute')) {
          dispatch('modals/open', { name: 'default', msg: this.$t('pages.invite.insufficient-balance') }, { root: true });
          return;
        }
        throw e;
      }
    },
    async getClient({ rootState: { network, current }, commit }, keypair) {
      const { internalUrl, compilerUrl } = network[current.network];
      const node = await Node({
        url: internalUrl,
        internalUrl,
      });
      const accounts = MemoryAccount({ keypair });
      return Ae({
        compilerUrl,
        nodes: [{ name: current.network, instance: node }],
        accounts: [accounts],
      });
    },
    async updateBalances({ rootState: { sdk }, state: { links }, commit }) {
      await Promise.all(
        links.map(async ({ publicKey }, idx) => {
          const balance = parseFloat(
            await sdk.balance(publicKey, { format: AE_AMOUNT_FORMATS.AE }).catch(() => 0),
          ).toFixed(2);
          commit('setBalance', { idx, balance });
        }),
      );
    },
  },
};
