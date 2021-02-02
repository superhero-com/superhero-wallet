import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { unionBy } from 'lodash-es';
import { convertToken, fetchJson } from '../../popup/utils/helper';

export default {
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
    addTokenBalance(state, payload) {
      state.tokenBalances = unionBy([payload], state.tokenBalances, 'contract');
    },
    setAePublicData(state, payload) {
      state.aePublicData = payload;
    },
  },
  actions: {
    async getAvailableTokens({ rootGetters: { activeNetwork }, commit }) {
      const availableTokens = await fetchJson(
        `${activeNetwork.backendUrl}/tokenCache/tokenInfo`,
      ).catch((e) => console.log(e));
      return commit('setAvailableTokens', availableTokens || {});
    },
    async tokenBalance({ rootState: { sdk } }, [token, address]) {
      const tokenContract = await sdk.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, {
        contractAddress: token,
      });

      const { decodedResult } = await tokenContract.methods.balance(address);
      return new BigNumber(decodedResult || 0);
    },
    async loadTokenBalances(
      {
        rootGetters: { activeNetwork },
        state: { availableTokens, selectedToken },
        commit,
        dispatch,
      },
      address,
    ) {
      const tokens = await fetchJson(
        `${activeNetwork.backendUrl}/tokenCache/balances?address=${address}`,
      ).catch((e) => console.log(e));

      commit('resetTokenBalances');

      await Promise.all(
        Object.entries(tokens).map(async ([contract, tokenData]) => {
          const tokenBalance = await dispatch('tokenBalance', [contract, address]);
          const balance = convertToken(tokenBalance, -tokenData.decimals);
          const convertedBalance = balance.toFixed(2);
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
          if (availableTokens[contract]) {
            const updatedTokenInfo = { ...availableTokens };
            updatedTokenInfo[contract] = { ...objectStructure };
            commit('setAvailableTokens', updatedTokenInfo);
          }
          if (selectedToken && selectedToken.contract === objectStructure.contract) {
            commit('setSelectedToken', null);
            commit('setSelectedToken', objectStructure);
          }
          return commit('addTokenBalance', objectStructure);
        }),
      );

      if (selectedToken && !tokens[selectedToken.contract]) {
        commit('setSelectedToken', null);
      }
    },
    async getAeternityData({ rootState: { current }, commit }) {
      const [aeternityData] = await fetchJson(
        `https://api.coingecko.com/api/v3/coins/markets?ids=aeternity&vs_currency=${current.currency}`,
      );
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
        from_account: account.publicKey,
        for_account: activeNetwork.tipContractV2.replace('ct_', 'ak_'),
      });
      const allowanceAmount =
        decodedResult !== undefined
          ? new BigNumber(decodedResult)
              .multipliedBy(-1)
              .plus(convertToken(amount, selectedToken.decimals))
              .toNumber()
          : convertToken(amount, selectedToken.decimals).toFixed();
      return tokenContract.methods[
        decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
      ](activeNetwork.tipContractV2.replace('ct_', 'ak_'), allowanceAmount);
    },
    async transfer({ rootState: { sdk }, state: { selectedToken } }, [toAccount, amount, option]) {
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
};
