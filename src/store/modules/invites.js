import Vue from 'vue';
import { Crypto } from '@aeternity/aepp-sdk/es';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import { aettosToAe } from '../../popup/utils/helper';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';

export default {
  namespaced: true,
  state: {
    referrals: [],
  },
  getters: {
    get: state => link => state.referrals.find(r => r.link === link),
    keypair: () => referral => {
      const segments = new URL(referral).pathname.split('/');
      const secret = segments[2];
      const { publicKey, secretKey } = Crypto.generateKeyPairFromSecret(
        Crypto.decodeBase58Check(secret),
      );

      return {
        publicKey: `ak_${Crypto.encodeBase58Check(Buffer.from(publicKey))}`,
        secretKey: Buffer.from(secretKey).toString('hex'),
      };
    },
  },
  mutations: {
    add(state, link) {
      state.referrals.unshift(link);
    },
    setBalance(state, { idx, balance }) {
      Vue.set(state.referrals[idx], 'balance', balance);
    },
  },
  actions: {
    async claim({ rootState: { account, sdk }, state: { referrals }, dispatch }, idx) {
      const { publicKey, secretKey } = referrals[idx];
      await sdk.addAccount(MemoryAccount({ keypair: { publicKey, secretKey } }), { select: true });
      try {
        return sdk.transferFunds(1, account.publicKey, {
          payload: 'referral',
        });
      } catch (e) {
        dispatch('modals/open', { name: 'default', msg: e.message }, { root: true });
        return false;
      } finally {
        sdk.selectAccount(account.publicKey);
      }
    },
    async getBalances({ rootState: { sdk }, state: { referrals }, commit }) {
      await Promise.all(
        referrals.map(async ({ publicKey }, idx) => {
          const balance = parseFloat(
            await sdk.balance(publicKey, { format: AE_AMOUNT_FORMATS.AE }).catch(() => 0),
          ).toFixed(2);
          commit('setBalance', { idx, balance });
          return balance;
        }),
      );
    },
  },
};
