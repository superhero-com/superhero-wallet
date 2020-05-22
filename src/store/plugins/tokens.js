import * as aeternityTokens from 'aeternity-tokens';
import { isEmpty } from 'lodash-es';

export default store =>
  store.registerModule('tokens', {
    namespaced: true,
    state: {
      all: [],
    },
    getters: {
      owned(state, getters, { sdk, account: { publicKey } }) {
        let network = 'ae_mainnet';
        if (sdk) network = sdk.getNetworkId();
        return state.all.filter(t => t.owner === publicKey && t.network === network);
      },
      find: (state, { owned }) => address => owned.find(t => t.contract === address),
    },
    mutations: {
      add(state, token) {
        state.all = [...state.all, token];
      },
    },
    actions: {
      add({ rootState: { account, sdk }, commit }, token) {
        const tokenEntry = { ...token, owner: account.publicKey, network: sdk.getNetworkId() };
        commit('add', tokenEntry);
      },
      async extension({ rootState: { sdk }, getters: { owned } }, extension) {
        return (
          await Promise.all(
            owned.map(async ({ contract, ...tkn }) => {
              try {
                const instance = await sdk.getContractInstance(aeternityTokens.newToken(), {
                  contractAddress: contract,
                });
                const { decodedResult: extensions } = await instance.methods.aex9_extensions();
                if (extensions.includes(extension)) {
                  return { contract, ...tkn };
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
    },
  });
