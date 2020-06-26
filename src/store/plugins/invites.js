import Vue from 'vue';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { calculateFee, TX_TYPES } from '../../popup/utils/constants';
import { aeToAettos, aettosToAe } from '../../popup/utils/helper';

export default store =>
  store.registerModule('invites', {
    namespaced: true,
    state: {
      referrals: [],
      client: null,
    },
    getters: {
      get: state => link => state.referrals.find(r => r.link === link),
      // eslint-disable-next-line no-unused-vars
      keypair: state => referral => {
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
      allReferrals({ referrals }, getters, { sdk }, { activeNetwork }) {
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();

        return referrals.filter(r => r.networkId === networkId);
      },
    },
    mutations: {
      add(state, link) {
        state.referrals.unshift(link);
      },
      reset(state) {
        state.referrals = [];
      },
      setClient(state, client) {
        state.client = client;
      },
      setBalance(state, { i, balance }) {
        Vue.set(state.referrals, i, { ...state.referrals[i], balance });
      },
    },
    actions: {
      async claim({ rootState: { account }, dispatch, getters: { get, keypair } }, referral) {
        const { publicKey, secretKey } = get(referral);
        const sdkInstance = await dispatch(
          'getClient',
          publicKey ? { publicKey, secretKey } : keypair(referral),
        );
        const balance = await sdkInstance.balance(publicKey).catch(() => 0);
        if (!balance) {
          return false;
        }
        const fee = +aeToAettos(
          calculateFee(TX_TYPES.txSign, {
            ...sdkInstance.Ae.defaults,
          }).min,
        );
        const maxSpend = balance - fee;
        if (maxSpend <= 0) {
          return false;
        }
        try {
          const res = await sdkInstance.spend(maxSpend, account.publicKey, { payload: 'referral' });
          return res;
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
      async getBalances({ state: { referrals, client }, dispatch, getters: { keypair }, commit }) {
        await Promise.all(
          referrals.map(async ({ link, publicKey, secretKey }, i) => {
            const address = publicKey || keypair(link).publicKey;
            const secret = secretKey || keypair(link).secretKey;
            const sdk =
              client || (await dispatch('getClient', { publicKey: address, secretKey: secret }));

            const balance = parseFloat(
              +aettosToAe(await sdk.balance(address).catch(() => 0)),
            ).toFixed(2);
            commit('setBalance', { i, balance });
            return balance;
          }),
        );
      },
    },
  });
