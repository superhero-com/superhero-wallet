import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash-es';

import FungibleTokenFullInterfaceACI from '@/lib/contracts/FungibleTokenFullInterfaceACI.json';
import AedexV2PairACI from '@/lib/contracts/AedexV2PairACI.json';
import ZeitTokenACI from '@/lib/contracts/FungibleTokenFullACI.json';
import {
  fetchAllPages,
  toShiftedBigNumber,
} from '@/utils';
import {
  handleUnknownError,
  calculateSupplyAmount,
} from '@/popup/utils';
import { useMiddleware, useAeSdk } from '@/composables';

export default (store) => {
  const { getAeSdk } = useAeSdk({ store });

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
              const balance = toShiftedBigNumber(amount, -token.decimals);
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
        { rootGetters: { activeNetwork, account } },
        [contractId, amount],
      ) {
        const aeSdk = await getAeSdk();
        const selectedToken = store.state.fungibleTokens.tokens?.[account.address]?.tokenBalances
          ?.find((t) => t?.contractId === contractId);
        const tokenContract = await aeSdk.initializeContract({
          aci: FungibleTokenFullInterfaceACI,
          address: selectedToken.contractId,
        });
        const { decodedResult } = await tokenContract.allowance({
          from_account: account.address,
          for_account: activeNetwork.tipContractV2.replace('ct_', 'ak_'),
        });
        const allowanceAmount = decodedResult !== undefined
          ? new BigNumber(decodedResult)
            .multipliedBy(-1)
            .plus(toShiftedBigNumber(amount, selectedToken.decimals))
            .toNumber()
          : toShiftedBigNumber(amount, selectedToken.decimals).toFixed();
        return tokenContract.methods[
          decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
        ](activeNetwork.tipContractV2.replace('ct_', 'ak_'), allowanceAmount);
      },
      async getContractTokenPairs(
        { state: { availableTokens }, rootGetters: { account } },
        address,
      ) {
        try {
          const aeSdk = await getAeSdk();
          const tokenContract = await aeSdk.initializeContract({
            aci: AedexV2PairACI,
            address,
          });

          const [
            { decodedResult: balances },
            { decodedResult: balance },
            { decodedResult: token0 },
            { decodedResult: token1 },
            { decodedResult: reserves },
            { decodedResult: totalSupply },
          ] = await Promise.all([
            tokenContract.balances(),
            tokenContract.balance(account.address),
            tokenContract.token0(),
            tokenContract.token1(),
            tokenContract.get_reserves(),
            tokenContract.total_supply(),
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
      async transfer(_, [address, toAccount, amount, option]) {
        const aeSdk = await getAeSdk();
        const tokenContract = await aeSdk.initializeContract({
          aci: FungibleTokenFullInterfaceACI,
          address,
        });
        return tokenContract.transfer(toAccount, amount.toFixed(), option);
      },
      async burnTriggerPoS(_, [address, amount, posAddress, invoiceId, option]) {
        const aeSdk = await getAeSdk();
        const tokenContract = await aeSdk.initializeContract({
          aci: ZeitTokenACI,
          address,
        });
        return tokenContract.burn_trigger_pos(
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
