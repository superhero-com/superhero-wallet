import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import Vue from 'vue';
import { convertToken, fetchJson, handleUnknownError } from '../../popup/utils/helper';

export default (store) => {
  store.registerModule('fungibleTokens', {
    namespaced: true,
    state: {
      availableTokens: {},
      tokenBalances: [],
      selectedToken: null,
      aePublicData: {},
    },
    mutations: {
      setSelectedToken(state, payload) {
        state.selectedToken = payload;
      },
      setAvailableTokens(state, payload) {
        state.availableTokens = payload;
      },
      resetTokenBalances(state) {
        state.tokenBalances = [];
      },
      updateAvailableToken(state, token) {
        Vue.set(state.availableTokens, token.contract, token);
      },
      addTokenBalance(state, payload) {
        state.tokenBalances.push(payload);
      },
      setAePublicData(state, payload) {
        state.aePublicData = payload;
      },
    },
    actions: {
      async getAvailableTokens({ rootGetters: { activeNetwork }, commit }) {
        const response = await fetchJson(
          `${activeNetwork.middlewareUrl}/aex9/by_name`,
        ).catch(handleUnknownError);

        const availableTokens = response.reduce((obj, { contract_id: contract, ...other }) => ({
          ...obj, [contract]: { contract, ...other },
        }), {});
        return commit('setAvailableTokens', availableTokens);
      },
      async loadTokenBalances({
        rootGetters: { activeNetwork, account },
        state: { availableTokens, selectedToken },
        commit,
      }) {
        const tokens = await fetchJson(
          `${activeNetwork.middlewareUrl}/aex9/balances/account/${account.address}`,
        ).catch(handleUnknownError);

        commit('resetTokenBalances');

        tokens.map(({ amount, contract_id: contract }) => {
          const token = availableTokens[contract];
          const balance = convertToken(amount, -token.decimals);
          const convertedBalance = balance.toFixed(2);
          const objectStructure = {
            ...token,
            value: contract,
            text: `${convertedBalance} ${token.symbol}`,
            contract,
            balance,
            convertedBalance,
          };

          commit('updateAvailableToken', objectStructure);
          return commit('addTokenBalance', objectStructure);
        });
        commit('setSelectedToken',
          store.state.fungibleTokens.tokenBalances
            .find((t) => t.contract === selectedToken?.contract));
      },
      async getAeternityData({ rootState: { current }, commit }) {
        const [aeternityData] = await fetchJson(
          `https://api.coingecko.com/api/v3/coins/markets?ids=aeternity&vs_currency=${current.currency}`,
        ).catch((e) => {
          handleUnknownError(e);
          return [];
        });
        return commit('setAePublicData', aeternityData);
      },
      async createOrChangeAllowance(
        { rootState: { sdk }, state: { selectedToken }, rootGetters: { activeNetwork, account } },
        amount,
      ) {
        const tokenContract = await sdk.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, {
          contractAddress: selectedToken.contract,
        });
        const { decodedResult } = await tokenContract.methods.allowance({
          from_account: account.address,
          for_account: activeNetwork.tipContractV2.replace('ct_', 'ak_'),
        });
        const allowanceAmount = decodedResult !== undefined
          ? new BigNumber(decodedResult)
            .multipliedBy(-1)
            .plus(convertToken(amount, selectedToken.decimals))
            .toNumber()
          : convertToken(amount, selectedToken.decimals).toFixed();
        return tokenContract.methods[
          decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
        ](activeNetwork.tipContractV2.replace('ct_', 'ak_'), allowanceAmount);
      },
      async transfer(
        { rootState: { sdk }, state: { selectedToken } },
        [toAccount, amount, option],
      ) {
        const tokenContract = await sdk.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, {
          contractAddress: selectedToken.contract,
        });
        return tokenContract.methods.transfer(
          toAccount,
          convertToken(amount, selectedToken.decimals).toFixed(),
          option,
        );
      },
    },
  });

  store.watch(
    ({ middleware }) => middleware,
    async (middleware) => {
      if (!middleware) return;

      await store.dispatch('fungibleTokens/getAvailableTokens');
      await store.dispatch('fungibleTokens/loadTokenBalances');
    },
    { immediate: true },
  );
};
