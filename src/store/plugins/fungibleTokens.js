import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash-es';
import pairInterface from 'dex-contracts-v2/build/IAedexV2Pair.aes';
import {
  convertToken,
  handleUnknownError,
  calculateSupplyAmount,
  fetchAllPages,
} from '../../popup/utils';
import { ZEIT_TOKEN_INTERFACE } from '../../popup/utils/constants';
import { useMiddleware } from '../../composables';

export default (store) => {
  store.registerModule('fungibleTokens', {
    namespaced: true,
    state: {
      availableTokens: {},
      tokens: {},
    },
    getters: {
      getTokenBalance: ({ tokens }) => (address) => tokens?.[address]?.tokenBalances || [],
      tokenBalances: (
        state, { getTokenBalance }, rootState, { account: { address } },
      ) => getTokenBalance(address),
    },
    mutations: {
      setAvailableTokens(state, payload) {
        state.availableTokens = payload;
      },
      resetTokensAndTransactions(state) {
        state.tokens = {};
        state.transactions = {};
      },
      addTokenBalance(state, tokens) {
        state.tokens = { ...state.tokens, ...tokens };
      },
    },
    actions: {
      async loadAvailableTokens({ commit }) {
        const { fetchFromMiddleware } = useMiddleware({ store });

        const response = await fetchAllPages(
          () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward'),
          fetchFromMiddleware,
        );

        if (isEmpty(response) || typeof response !== 'object') return commit('setAvailableTokens', {});

        const availableTokens = response.reduce((obj, { contract_id: contractId, ...other }) => ({
          ...obj, [contractId]: { contractId, ...other },
        }), {});
        return commit('setAvailableTokens', availableTokens);
      },
      async loadTokenBalances({
        rootGetters: { accounts },
        state: { availableTokens },
        commit,
      }) {
        const newBalances = {};
        const { fetchFromMiddleware } = useMiddleware({ store });

        await Promise.all(accounts.map(async ({ address }) => {
          try {
            if (isEmpty(availableTokens)) return;
            const tokens = await fetchAllPages(
              () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`),
              fetchFromMiddleware,
            );
            if (isEmpty(tokens) || typeof tokens !== 'object') return;
            const balances = tokens.map(({ amount, contract_id: contractId }) => {
              const token = availableTokens[contractId];
              if (!token) return null;
              const balance = convertToken(amount, -token.decimals);
              const convertedBalance = balance.toFixed(2);
              const objectStructure = {
                ...token,
                value: contractId,
                text: `${convertedBalance} ${token.symbol}`,
                contractId,
                balance,
                convertedBalance,
              };
              return objectStructure;
            });
            newBalances[address] = { tokenBalances: balances };
          } catch (e) {
            handleUnknownError(e);
          }
        }));
        commit('addTokenBalance', newBalances);
      },
      async createOrChangeAllowance(
        { rootGetters: { activeNetwork, account, 'sdkPlugin/sdk': sdk } },
        [contractId, amount],
      ) {
        const selectedToken = store.state.fungibleTokens.tokens?.[account.address]?.tokenBalances
          ?.find((t) => t?.contractId === contractId);
        const tokenContract = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
          contractAddress: selectedToken.contractId,
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
      async getContractTokenPairs(
        { state: { availableTokens }, rootGetters: { account, 'sdkPlugin/sdk': sdk } },
        contractAddress,
      ) {
        try {
          const tokenContract = await sdk.getContractInstance({
            source: pairInterface,
            contractAddress,
          });

          const [
            { decodedResult: balances },
            { decodedResult: balance },
            { decodedResult: token0 },
            { decodedResult: token1 },
            { decodedResult: reserves },
            { decodedResult: totalSupply },
          ] = await Promise.all([
            tokenContract.methods.balances(),
            tokenContract.methods.balance(account.address),
            tokenContract.methods.token0(),
            tokenContract.methods.token1(),
            tokenContract.methods.get_reserves(),
            tokenContract.methods.total_supply(),
          ]);

          return {
            token0: {
              ...availableTokens?.[token0],
              amount: calculateSupplyAmount(
                balance, totalSupply, reserves.reserve0,
              ),
              reserve: reserves.reserve0,
            },
            token1: {
              ...availableTokens?.[token1],
              amount: calculateSupplyAmount(
                balance, totalSupply, reserves.reserve1,
              ),
              reserve: reserves.reserve1,
            },
            totalSupply,
            balance,
            balances,
          };
        } catch (error) {
          return {};
        }
      },
      async transfer(
        { rootGetters: { 'sdkPlugin/sdk': sdk } },
        [contractId, toAccount, amount, option],
      ) {
        const tokenContract = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
          contractAddress: contractId,
        });
        return tokenContract.methods.transfer(toAccount, amount.toFixed(), option);
      },
      async burnTriggerPoS(
        { rootGetters: { 'sdkPlugin/sdk': sdk } },
        [contractId, amount, posAddress, invoiceId, option],
      ) {
        const tokenContract = await sdk.getContractInstance({
          source: ZEIT_TOKEN_INTERFACE,
          contractAddress: contractId,
        });
        return tokenContract.methods.burn_trigger_pos(
          amount.toFixed(), posAddress, invoiceId, option,
        );
      },
    },
  });

  store.watch(
    (state) => state.current.network,
    async (network, oldNetwork) => {
      const activeNetwork = store.getters.networks[network];
      const oldActiveNetwork = store.getters.networks[oldNetwork];
      if (activeNetwork?.middlewareUrl === oldActiveNetwork?.middlewareUrl) {
        return;
      }
      store.commit('fungibleTokens/resetTokensAndTransactions');

      await store.dispatch('fungibleTokens/loadAvailableTokens');
      await store.dispatch('fungibleTokens/loadTokenBalances');
    },
    { immediate: true },
  );

  store.watch(
    ({ accounts: { hdWallet: { nextAccountIdx } } }) => nextAccountIdx,
    async () => {
      await store.dispatch('fungibleTokens/loadTokenBalances');
    },
  );
};
