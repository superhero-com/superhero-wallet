import Vue from 'vue';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { unionBy, isEqual } from 'lodash-es';
import { convertToken, fetchJson, handleUnknownError } from '../../popup/utils/helper';
import { ZEIT_TOKEN_INTERFACE } from '../../popup/utils/constants';

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
        rootGetters: { activeNetwork, accounts },
        state: { availableTokens },
        commit,
      }) {
        accounts.map(async ({ address }) => {
          const tokens = await fetchJson(
            `${activeNetwork.middlewareUrl}/aex9/balances/account/${address}`,
          ).catch(handleUnknownError);

          const selectedToken = store.state.fungibleTokens.tokens[address]?.selectedToken;

          commit('resetTokenBalances', address);

          tokens.filter(({ amount }) => amount).map(({ amount, contract_id: contract }) => {
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

            return commit('addTokenBalance', { address, token: objectStructure });
          });
          commit('setSelectedToken',
            {
              address,
              token: (store.state.fungibleTokens.tokens?.[address]?.tokenBalances || [])
                .find((t) => t.contract === selectedToken?.contract),
            });
        });
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
        { rootState: { sdk }, state: { tokens }, rootGetters: { activeNetwork, account } },
        amount,
      ) {
        const { selectedToken } = tokens[account.address];
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
        { rootState: { sdk }, state: { tokens }, rootGetters: { account } },
        [toAccount, amount, option],
      ) {
        const tokenContract = await sdk.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, {
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
        const tokenContract = await sdk.getContractInstance(ZEIT_TOKEN_INTERFACE, {
          contractAddress: tokens[account.address].selectedToken.contract,
        });
        return tokenContract.methods.burn_trigger_pos(
          convertToken(amount, tokens[account.address].selectedToken.decimals).toFixed(),
          posAddress,
          invoiceId,
          option,
        );
      },
      async getTokensHistory({ rootState, rootGetters: { activeNetwork, account }, commit }) {
        const { address } = account;
        const rawTransactions = ([
          ...(await fetchJson(`${activeNetwork.middlewareUrl}/aex9/transfers/to/${address}`)),
          ...(await fetchJson(`${activeNetwork.middlewareUrl}/aex9/transfers/from/${address}`)),
        ]);

        const transactions = await Promise.all(
          rawTransactions.map(async ({ call_txi: index, ...otherTx }) => ({
            ...(await rootState.middleware.getTxByIndex(index)), ...otherTx,
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
