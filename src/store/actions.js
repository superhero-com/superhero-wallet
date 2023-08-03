import { uniqBy, orderBy } from 'lodash-es';
import { Tag } from '@aeternity/aepp-sdk';
import {
  fetchJson,
  handleUnknownError,
  postJson,
} from '@/utils';
import JsonBig from '@/lib/json-big';
import { useMiddleware, useAeSdk } from '@/composables';
import { AEX9_TRANSFER_EVENT } from '@/protocols/aeternity/config';
import { isAccountNotFoundError } from '@/protocols/aeternity/helpers';

export default {
  switchNetwork({ commit }, payload) {
    commit('switchNetwork', payload);
    commit('initTransactions');
  },
  addPendingTransaction(context, transaction) {
    const { nodeNetworkId } = useAeSdk({ store: context });
    context.commit('addPendingTransaction', {
      network: nodeNetworkId.value,
      transaction: { ...transaction, microTime: Date.now(), pending: true },
    });
  },
  async fetchPendingTransactions(context, address) {
    const { state: { transactions } } = context;
    const { nodeNetworkId, getAeSdk } = useAeSdk({ store: context });
    const aeSdk = await getAeSdk();
    return (
      await aeSdk.api.getPendingAccountTransactionsByPubkey(address).then(
        (r) => JsonBig.parse(JsonBig.stringify(r.transactions)),
        (error) => {
          if (!isAccountNotFoundError(error)) {
            handleUnknownError(error);
          }
          return [];
        },
      )
    )
      .filter((transaction) => !transactions.pending[nodeNetworkId.value]
        ?.find((tx) => tx?.hash === transaction?.hash))
      .map((transaction) => ({ ...transaction, pending: true }));
  },
  async fetchTipWithdrawnTransactions(
    { state, getters, commit },
    {
      recent, limit = 5, address, multipleAccounts,
    },
  ) {
    if (state?.transactions?.tipWithdrawnTransactions?.length && !recent) {
      return state.transactions.tipWithdrawnTransactions;
    }
    const response = await fetchJson(
      `${getters.activeNetwork.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn${recent ? `&limit=${limit}` : ''}`,
    );
    if (response.message) return [];
    const tipWithdrawnTransactions = response.map(({
      amount, contract, height, data: { tx }, ...t
    }) => ({
      tx: {
        ...tx,
        address,
        amount,
        contractId: contract,
        type: Tag[Tag.ContractCallTx],
      },
      ...t,
      microTime: new Date(t.createdAt).getTime(),
      blockHeight: height,
      claim: true,
    }));
    if (!multipleAccounts) {
      commit('setTipWithdrawnTransactions', tipWithdrawnTransactions);
    }
    return tipWithdrawnTransactions;
  },
  async fetchTransactions(context, {
    limit, recent, address, multipleAccounts = false,
  }) {
    const {
      state, getters, dispatch, commit,
    } = context;
    if (state.transactions.nextPageUrl === null && !recent) {
      return null;
    }

    const { nodeNetworkId } = useAeSdk({ store: context });
    const { getMiddleware, fetchFromMiddlewareCamelCased } = useMiddleware({ store: context });

    let txs = await Promise.all([
      fetchFromMiddlewareCamelCased(
        recent || state.transactions.nextPageUrl === ''
          ? `/v2/accounts/${address}/activities?limit=${limit}`
          : state.transactions.nextPageUrl,
      )
        .then(({ data, next }) => {
          if (!recent) commit('setTransactionsNextPage', next);
          return data;
        })
        .catch(() => []),
      dispatch('fetchPendingTransactions', address),
      dispatch('fetchTipWithdrawnTransactions', { recent, address, multipleAccounts }),
    ]);
    const tipWithdrawnTransactions = txs[2];

    const lastTransaction = txs[0]?.[txs[0].length - 1];
    // DEX transaction is represented in 3 objects, only last one should be used
    // this condition checking edge case when not all 3 objects in one chunk
    if (lastTransaction?.type === AEX9_TRANSFER_EVENT) {
      const middleware = await getMiddleware();
      txs[0][txs[0].length - 1] = await middleware.getTx(lastTransaction.payload.txHash);
    }

    txs = [...txs[1], ...txs[0]].filter(({ type }) => !type?.startsWith('Internal')).map((tx) => ({
      ...(tx.payload ? tx.payload : tx),
      transactionOwner: address,
      ...(tx.type === AEX9_TRANSFER_EVENT
        ? {
          tx: {
            ...tx.payload,
            callerId: tx.payload.senderId,
            type: 'ContractCallTx',
          },
          hash: tx.payload.txHash,
          incomplete: true,
        }
        : {}),
    }));

    txs = uniqBy(txs.reverse(), 'hash').reverse();
    const minMicroTime = Math.min.apply(null, txs.map((tx) => tx.microTime));
    tipWithdrawnTransactions.forEach((f) => {
      if (minMicroTime < f.microTime || (txs.length === 0 && minMicroTime > f.microTime)) {
        txs.push({ ...f, transactionOwner: address });
      }
    });
    txs = orderBy(txs, ['microTime'], ['desc']);
    const network = getters.activeNetwork.networkId;
    if (state.transactions.pending[network] && !multipleAccounts) {
      state.transactions.pending[network].forEach(({ hash }) => {
        if (txs.some((tx) => tx.hash === hash && !tx.pending)) {
          commit('removePendingTransactionByHash', { hash, network: nodeNetworkId.value });
        }
      });
    }
    if (multipleAccounts) {
      return recent ? txs.slice(0, limit) : txs;
    }
    commit('addTransactions', recent ? txs.slice(0, limit) : txs);
    return null;
  },
  async claimTips({ getters: { activeNetwork } }, { url, address }) {
    return postJson(`${activeNetwork.backendUrl}/claim/submit`, { body: { url, address } });
  },
  async cacheInvalidateOracle({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/oracle`);
  },
  async cacheInvalidateTips({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/tips`);
  },
  async donateError({ getters: { activeNetwork } }, error) {
    return postJson(`${activeNetwork.backendUrl}/errorreport`, { body: error });
  },
  async getCacheChainNames({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/chainnames`);
  },
  async getCacheTip({ getters: { activeNetwork } }, id) {
    return fetchJson(`${activeNetwork.backendUrl}/tips/single/${id}`);
  },
  async share(_, options) {
    await (process.env.IS_CORDOVA
      ? new Promise((resolve) => window.plugins.socialsharing.shareW3C(
        options,
        ({ app }) => app && resolve(),
      ))
      : navigator.share(options));
  },
};
