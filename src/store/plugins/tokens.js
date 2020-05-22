import * as aeternityTokens from 'aeternity-tokens';
import { isEmpty } from 'lodash-es';

export default store =>
  store.registerModule('tokens', {
    namespaced: true,
    state: {
      all: [],
      contractInstances: {},
    },
    getters: {
      owned(state, getters, { sdk, account: { publicKey } }) {
        let network = 'ae_mainnet';
        if (sdk) network = sdk.getNetworkId();
        return state.all.filter(t => t.owner === publicKey && t.network === network);
      },
      find: (state, { owned }) => address => owned.find(t => t.contract === address),
      getInstance: state => contract => state.contractInstances[contract],
    },
    mutations: {
      add(state, token) {
        state.all = [...state.all, token];
      },
      setBalance(state, { contract, token }) {
        state.all = [...state.all.filter(t => t.contract !== contract), token];
      },
      setContractInstance(state, { contract, instance }) {
        state.contractInstances[contract] = instance;
      },
      setExtensions(state, { contract, token }) {
        state.all = [...state.all.filter(t => t.contract !== contract), token];
      },
    },
    actions: {
      add({ rootState: { account, sdk }, commit }, token) {
        const tokenEntry = { ...token, owner: account.publicKey, network: sdk.getNetworkId() };
        commit('add', tokenEntry);
      },
      async extension({ getters: { owned }, commit, dispatch }, extension) {
        return (
          await Promise.all(
            owned.map(async ({ contract, ...token }) => {
              try {
                if (token.extensions) {
                  return token.extensions.includes(extension) ? { contract, ...token } : {};
                }
                const instance = await dispatch('instance', contract);
                const { decodedResult: extensions } = await instance.methods.aex9_extensions();
                const tokenEntry = { contract, ...token, extensions };
                commit('setExtensions', { contract, token: tokenEntry });
                if (extensions.includes(extension)) {
                  return { contract, ...token };
                }
              } catch (error) {
                // console.log('error ', error);
              }
              return {};
            }),
          )
        )
          .filter(t => !isEmpty(t))
          .map(t => ({ ...t, text: t.name, value: t.contract }));
      },
      async balances({ rootState: { account }, getters: { owned }, commit, dispatch }) {
        return Promise.all(
          owned.map(async ({ contract, ...token }) => {
            try {
              const instance = await dispatch('instance', contract);

              const { decodedResult: balance } = await instance.methods.balance(account.publicKey);
              const tokenEntry = { contract, ...token, balance };
              commit('setBalance', { contract, token: tokenEntry });
            } catch (e) {
              console.log(e);
            }
          }),
        );
      },
      async instance({ getters: { getInstance }, rootState: { sdk }, commit }, contract) {
        let instance = getInstance(contract);
        if (!instance) {
          instance = await sdk.getContractInstance(
            aeternityTokens.newToken(['allowances', 'swappable', 'burnable', 'mintable']),
            {
              contractAddress: contract,
            },
          );
          commit('setContractInstance', { contract, instance });
        }
        return instance;
      },
    },
  });
