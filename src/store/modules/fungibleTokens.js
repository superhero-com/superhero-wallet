import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { unionBy } from 'lodash-es';
import { fetchJson, convertToken } from '../../popup/utils/helper';

export default {
  namespaced: true,
  state: {
    tokenInfo: {},
    tokenBalances: [],
    selectedToken: {},
    aeTokenInfo: {},
  },
  getters: {
    isFungibleToken({ selectedToken }) {
      return Object.keys(selectedToken).length > 0;
    },
  },
  mutations: {
    setSelectedToken(state, payload) {
      state.selectedToken = payload;
    },
    setTokenInfo(state, payload) {
      state.tokenInfo = payload;
    },
    addTokenBalance(state, payload) {
      state.tokenBalances = unionBy([payload], state.tokenBalances, 'contract');
    },
    setPublicAeTokenInfo(state, payload) {
      state.aeTokenInfo = payload;
    },
  },
  actions: {
    async getTokenInfo({ rootGetters: { activeNetwork }, commit }) {
      const tokensInfo = await fetchJson(
        `${activeNetwork.backendUrl}/tokenCache/tokenInfo`,
      ).catch(e => console.log(e));

      return commit('setTokenInfo', tokensInfo || {});
    },
    async tokenBalance({ rootState: { sdk } }, [token, address]) {
      const tokenContract = await sdk.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, {
        contractAddress: token,
      });

      const { decodedResult } = await tokenContract.methods.balance(address);
      return new BigNumber(decodedResult || 0).toFixed();
    },
    async loadTokenBalances(
      { rootGetters: { activeNetwork }, state: { tokenInfo }, commit, dispatch },
      address,
    ) {
      const tokens = await fetchJson(
        `${activeNetwork.backendUrl}/tokenCache/balances?address=${address}`,
      ).catch(e => console.log(e));
      if (!tokens) {
        return;
      }
      await Promise.all(
        Object.entries(tokens).map(async ([contract, tokenData]) => {
          const balance = await dispatch('tokenBalance', [contract, address]);
          const convertedBalance = convertToken(balance, -tokenData.decimals).toFixed(2);
          const objectStructure = {
            value: contract,
            text: `${convertedBalance} ${tokenData.symbol}`,
            symbol: tokenData.symbol,
            name: tokenData.name,
            decimals: tokenData.decimals,
            contract,
            balance,
            convertedBalance,
          };
          if (Object.keys(tokenInfo[contract].length > 0)) {
            const updatedTokenInfo = { ...tokenInfo };
            updatedTokenInfo[contract] = { ...objectStructure };
            commit('setTokenInfo', updatedTokenInfo);
          }
          return commit('addTokenBalance', objectStructure);
        }),
      );
    },
    async aeternityInfo({ rootState: { current }, commit }) {
      const aeternityInfo = await fetchJson(
        `https://api.coingecko.com/api/v3/coins/markets?ids=aeternity&vs_currency=${current.currency}`,
      ).catch(e => console.log(e));
      return commit('setPublicAeTokenInfo', aeternityInfo ? aeternityInfo[0] : {});
    },
  },
};
