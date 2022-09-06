import Vue from 'vue';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import { isEqual, isEmpty, uniqBy } from 'lodash-es';
import pairInterface from 'dex-contracts-v2/build/IAedexV2Pair.aes';
import {
  convertToken, fetchJson, handleUnknownError, calculateSupplyAmount,
} from '../../popup/utils/helper';
import { CURRENCY_URL, ZEIT_TOKEN_INTERFACE, AETERNITY_CONTRACT_ID } from '../../popup/utils/constants';

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
      tokenBalances: (
        state, { getTokenBalance }, rootState, { account: { address } },
      ) => getTokenBalance(address),
      getAeternityToken: ({ aePublicData }) => ({ balanceCurrency, tokenBalance }) => {
        const aePublicDataExists = aePublicData && Object.keys(aePublicData).length > 0;
        return {
          ...(aePublicDataExists ? aePublicData : {}),
          convertedBalance: tokenBalance,
          symbol: 'AE',
          balanceCurrency,
          contractId: AETERNITY_CONTRACT_ID,
        };
      },
    },
    mutations: {
      setTransactions(state, { address, transactions }) {
        Vue.set(state.transactions, address, transactions);
      },
      setAvailableTokens(state, payload) {
        state.availableTokens = payload;
      },
      resetTokens(state) {
        state.tokens = {};
      },
      resetTransactions(state) {
        state.transactions = {};
      },
      addTokenBalance(state, { address, balances }) {
        if (!(address in state.tokens)) {
          Vue.set(state.tokens, address, { tokenBalances: [] });
        }
        Vue.set(state.tokens[address], 'tokenBalances', balances);
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

        if (isEmpty(response) || typeof response !== 'object') return commit('setAvailableTokens', {});

        const availableTokens = response.reduce((obj, { contract_id: contractId, ...other }) => ({
          ...obj, [contractId]: { contractId, ...other },
        }), {});
        return commit('setAvailableTokens', availableTokens);
      },
      async loadTokenBalances({
        rootGetters: { activeNetwork, accounts },
        state: { availableTokens },
        commit,
      }) {
        accounts.map(async ({ address }) => {
          try {
            if (isEmpty(availableTokens)) return;
            const tokens = await fetchJson(
              `${activeNetwork.middlewareUrl}/aex9/balances/account/${address}`,
            ).catch(handleUnknownError);

            if (isEmpty(tokens) || typeof tokens !== 'object') return;

            // TODO: remove uniqBy after https://github.com/aeternity/ae_mdw/issues/735 is fixed and released
            const balances = uniqBy(tokens, 'contract_id').map(({ amount, contract_id: contractId }) => {
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
            commit('addTokenBalance', { address, balances });
          } catch (e) {
            handleUnknownError(e);
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
        { rootState: { sdk }, rootGetters: { activeNetwork, account } },
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
        { rootState: { sdk }, state: { availableTokens }, rootGetters: { account } },
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
        { rootState: { sdk } },
        [contractId, toAccount, amount, option],
      ) {
        const tokenContract = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
          contractAddress: contractId,
        });
        return tokenContract.methods.transfer(toAccount, amount.toFixed(), option);
      },
      async burnTriggerPoS(
        { rootState: { sdk } },
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
      async getTokensHistory(
        {
          state: { transactions },
          rootGetters: { activeNetwork, account, getDexContracts }, commit,
        }, recent,
      ) {
        const { address } = account;
        if (transactions[address]?.length && !recent) return transactions[address];

        let rawTransactions = [];
        const lastTransaction = transactions[address]?.[0];
        if (recent) {
          let nextPageUrl;
          let isAllNewTransactionsLoadded = false;
          while (nextPageUrl !== null && !isAllNewTransactionsLoadded) {
            // eslint-disable-next-line no-await-in-loop
            const { data, next } = await (fetchJson(nextPageUrl
              ? `${activeNetwork.middlewareUrl}/${nextPageUrl}`
              : `${activeNetwork.middlewareUrl}/v2/aex9/transfers/to/${address}`));
            if (data?.length) rawTransactions.push(...data);
            if (data?.some((t) => t?.tx_hash === lastTransaction?.hash)
            || !transactions[address]?.length) {
              isAllNewTransactionsLoadded = true;
            }
            nextPageUrl = next || null;
          }
          if (rawTransactions?.[0]?.tx_hash === lastTransaction?.hash) {
            return transactions[address].slice(0, 10);
          }
        } else {
          rawTransactions = await fetchJson(`${activeNetwork.middlewareUrl}/aex9/transfers/to/${address}`);
        }

        const newTransactions = rawTransactions
          .filter((tx) => !getDexContracts.router.includes(tx.contract_id))
          .map((tx) => ({
            ...tx,
            tx: {
              contractId: tx.contract_id,
              senderId: tx.sender,
              recipientId: tx.recipient,
              callerId: tx.sender,
              type: 'ContractCallTx',
            },
            recipient: tx.recipient,
            incomplete: true,
            microTime: tx.micro_time,
            hash: tx.tx_hash,
          }));

        if (newTransactions?.[0]?.hash !== lastTransaction?.hash && recent) {
          commit('setTransactions', {
            address, transactions: uniqBy([...newTransactions, ...(transactions[address] || [])], 'hash'),
          });
          return newTransactions;
        }
        commit('setTransactions', { address, transactions: newTransactions.reverse() });
        return newTransactions;
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
      store.commit('fungibleTokens/resetTransactions');
    },
  );

  store.watch(
    ({ accounts: { hdWallet: { nextAccountIdx } } }) => nextAccountIdx,
    async () => {
      if (!store.state.middleware) return;
      await store.dispatch('fungibleTokens/loadTokenBalances');
    },
  );
};
