import Vue from 'vue';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';

export default {
  namespaced: true,
  state: {
    referrals: [],
    client: null,
  },
  mutations: {
    add(state, link) {
      state.referrals.unshift(link);
    },
    setClient(state, client) {
      state.client = client;
    },
    setBalance(state, { idx, balance }) {
      Vue.set(state.referrals[idx], 'balance', balance);
    },
  },
  actions: {
    async claim({ rootState: { account }, state: { referrals }, dispatch }, idx) {
      const { publicKey, secretKey } = referrals[idx];
      const sdk = await dispatch('getClient', { publicKey, secretKey });
      try {
        return sdk.transferFunds(1, account.publicKey, {
          payload: 'referral',
        });
      } catch (e) {
        dispatch('modals/open', { name: 'default', msg: e.message }, { root: true });
        return false;
      }
    },
    async getClient({ rootState: { network, current }, commit }, keypair) {
      const { internalUrl, compilerUrl } = network[current.network];
      const node = await Node({
        url: internalUrl,
        internalUrl,
      });
      const accounts = MemoryAccount({ keypair });
      const sdkInstance = await Ae({
        compilerUrl,
        nodes: [{ name: current.network, instance: node }],
        accounts: [accounts],
      });
      commit('setClient', sdkInstance);

      return sdkInstance;
    },
    async getBalances({ rootState: { sdk }, state: { referrals }, commit }) {
      await Promise.all(
        referrals.map(async ({ publicKey }, idx) => {
          const balance = parseFloat(
            await sdk.balance(publicKey, { format: AE_AMOUNT_FORMATS.AE }).catch(() => 0),
          ).toFixed(2);
          commit('setBalance', { idx, balance });
        }),
      );
    },
  },
};
