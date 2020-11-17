import { newToken } from 'aeternity-tokens';
import { isEmpty } from 'lodash-es';
import { convertToken } from '../../popup/utils/helper';

export default store =>
  store.registerModule('tokens', {
    namespaced: true,
    state: {
      all: [],
      contractInstances: {},
    },
    getters: {
      owned(state, { getInstance }, { sdk, account: { publicKey } }, { activeNetwork }) {
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();
        return state.all
          .filter(({ owner, network }) => owner === publicKey && network === networkId)
          .map(({ balance, decimals, contract, ...t }) => {
            const getBalance = (amount, precision) => bal =>
              parseFloat(convertToken(bal || amount, -precision)).toFixed(2);
            const convertBalance = precision => bal => convertToken(bal, precision);

            return {
              ...t,
              balance,
              decimals,
              contract,
              instance: getInstance(contract),
              getBalance: getBalance(balance, decimals),
              convertBalance: convertBalance(decimals),
            };
          });
      },
      find: (state, { owned }) => address => owned.find(t => t.contract === address),
      getInstance: state => contract => state.contractInstances[contract],
    },
    mutations: {
      add(state, token) {
        state.all = [...state.all, token];
      },
      setBalance(state, { contract, balance }) {
        state.all = state.all.map(t => (t.contract === contract ? { ...t, balance } : t));
      },
      setContractInstance(state, { contract, instance }) {
        state.contractInstances[contract] = instance;
      },
      setExtensions(state, { contract, extensions }) {
        state.all = state.all.map(t => (t.contract === contract ? { ...t, extensions } : t));
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
                commit('setExtensions', { contract, extensions });
                if (extensions.includes(extension)) {
                  return { contract, ...token };
                }
              } catch (error) {
                console.log(error);
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
          owned.map(async ({ contract }) => {
            try {
              const instance = await dispatch('instance', contract);

              const { decodedResult: balance } = await instance.methods.balance(account.publicKey);
              commit('setBalance', { contract, balance: parseInt(balance, 10) });
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
            newToken(['allowances', 'swappable', 'burnable', 'mintable']),
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
