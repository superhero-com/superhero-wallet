import Vue from 'vue';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { unionBy, isEqual, isEmpty } from 'lodash-es';
import { CURRENCY_URL, ZEIT_TOKEN_INTERFACE } from '../../popup/utils/constants';
import {
  convertToken, fetchJson, getAllPages, handleUnknownError,
} from '../../popup/utils/helper';

export default (store) => {
  store.registerModule('fungibleTokens', {
    namespaced: true,
    state: {
      availableTokens: {},
      tokens: {},
      aePublicData: {},
      transactions: {},
    },
    getters: {
      getTokenBalance: ({ tokens }) => (address) => tokens?.[address]?.tokenBalances || [],
      getSelectedToken: ({ tokens }) => (address) => tokens?.[address]?.selectedToken,
      tokenBalances: (
        state, { getTokenBalance }, rootState, { account: { address } },
      ) => getTokenBalance(address),
      selectedToken: (
        state, { getSelectedToken }, rootState, { account: { address } },
      ) => getSelectedToken(address),
    },
    mutations: {
      setSelectedToken(state, { address, token }) {
        if (!(address in state.tokens)) {
          Vue.set(state.tokens, address, { selectedToken: null, tokenBalances: [] });
        }
        Vue.set(state.tokens[address], 'selectedToken', token);
      },
      setTransactions(state, { address, transactions }) {
        Vue.set(state.transactions, address, transactions);
      },
      setAvailableTokens(state, payload) {
        state.availableTokens = payload;
      },
      resetTokenBalances(state, address) {
        if (address in state.tokens) {
          state.tokens[address].tokenBalances = [];
        }
      },
      resetTokens(state) {
        state.tokens = {};
      },
      addTokenBalance(state, { address, token }) {
        if (!(address in state.tokens)) {
          Vue.set(state.tokens, address, { selectedToken: null, tokenBalances: [] });
        }
        Vue.set(
          state.tokens[address],
          'tokenBalances',
          unionBy([token], state.tokens[address].tokenBalances, 'contract'),
        );
      },
      setAePublicData(state, payload) {
        state.aePublicData = payload;
      },
    },
    actions: {
      async getAvailableTokens({ rootState: { middleware }, commit }) {
        if (!middleware) return;
        const result = await getAllPages(() => middleware.fetchByPath('/v2/aex9?by=name&limit=100'), middleware.fetchByPath);
        if (!result?.length) {
          commit('setAvailableTokens', {});
          return;
        }

        const availableTokens = result.reduce((obj, { contractId: contract, ...other }) => ({
          ...obj, [contract]: { contract, ...other },
        }), {});
        commit('setAvailableTokens', availableTokens);
      },
      async loadTokenBalances({
        rootGetters: { accounts },
        rootState: { middleware, fungibleTokens },
        state: { availableTokens },
        commit,
      }) {
        accounts.map(async ({ address }) => {
          let selectedToken = null;
          try {
            if (isEmpty(availableTokens) || !middleware) return;

            const tokens = await getAllPages(() => middleware.fetchByPath(`/v2/aex9/account-balances/${address}?scope=gen:5000-6000`), middleware.fetchByPath);

            if (!tokens?.length) return;

            selectedToken = fungibleTokens.tokens[address]?.selectedToken;

            commit('resetTokenBalances', address);

            tokens.filter(({ amount }) => amount).map(({ amount, contractId: contract }) => {
              const token = availableTokens[contract];
              if (!token) return null;
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

              return commit('addTokenBalance', { address, token: objectStructure });
            });
          } catch (e) {
            handleUnknownError(e);
          } finally {
            commit('setSelectedToken',
              {
                address,
                token: (fungibleTokens.tokens?.[address]?.tokenBalances || [])
                  .find((t) => t.contract === selectedToken?.contract),
              });
          }
        });
      },
      async getAeternityData({ rootState: { current }, commit }) {
        const [aeternityData] = await fetchJson(
          `${CURRENCY_URL}${current.currency}`,
        ).catch((e) => {
          handleUnknownError(e);
          return [];
        });
        return commit('setAePublicData', aeternityData);
      },
      async createOrChangeAllowance(
        { rootState: { sdk }, state: { tokens }, rootGetters: { activeNetwork, account } },
        amount,
      ) {
        const { selectedToken } = tokens[account.address];
        const tokenContract = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
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
        { rootState: { sdk }, state: { tokens }, rootGetters: { account } },
        [toAccount, amount, option],
      ) {
        const tokenContract = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
          contractAddress: tokens[account.address].selectedToken.contract,
        });
        return tokenContract.methods.transfer(
          toAccount,
          convertToken(amount, tokens[account.address].selectedToken.decimals).toFixed(),
          option,
        );
      },
      async burnTriggerPoS(
        { rootState: { sdk }, state: { tokens }, rootGetters: { account } },
        [amount, posAddress, invoiceId, option],
      ) {
        const tokenContract = await sdk.getContractInstance({
          source: ZEIT_TOKEN_INTERFACE,
          contractAddress: tokens[account.address].selectedToken.contract,
        });
        return tokenContract.methods.burn_trigger_pos(
          convertToken(amount, tokens[account.address].selectedToken.decimals).toFixed(),
          posAddress,
          invoiceId,
          option,
        );
      },
      async getTokensHistory({
        rootGetters: { account },
        rootState: { middleware },
        commit,
      }) {
        const { address } = account;
        const rawTransactions = await middleware.fetchByPath(`/aex9/transfers/to/${address}`);

        const transactions = await Promise.all(
          rawTransactions.map(async ({ callTxi: index, ...otherTx }) => ({
            ...(await middleware.getTxByIndex(index)), ...otherTx,
          })),
        );
        commit('setTransactions', { address, transactions });
        return transactions;
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

  store.watch(
    (state, { activeNetwork }) => activeNetwork,
    async (network, oldNetwork) => {
      if (isEqual(network, oldNetwork)) return;
      store.commit('fungibleTokens/resetTokens');
    },
  );

  store.watch(
    ({ accounts: { hdWallet: { nextAccountIdx } } }) => nextAccountIdx,
    async () => {
      if (!store.state.middleware) return;
      await store.dispatch('fungibleTokens/loadTokenBalances');
    },
    { immediate: true },
  );
};
