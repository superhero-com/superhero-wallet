import camelcaseKeysDeep from 'camelcase-keys-deep';
import { flatten, orderBy } from 'lodash-es';
import { computed } from '@vue/composition-api';
import { fetchJson, TXS_PER_PAGE, watchUntilTruthy } from '../popup/utils';
import type { IDefaultComposableOptions, INetwork, ITransaction } from '../types';
import { useFungibleTokens } from './fungibleTokens';

export interface IFetchTransactionsOptions {
  limit?: number
  recent?: boolean
  address: string
}

export function useTransactions({ store }: IDefaultComposableOptions) {
  const { fetchTokensHistory } = useFungibleTokens({ store });
  const middleware = computed(() => store.state.middleware);
  const transactions = computed(() => store.state.transactions);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function fetchTransactions({
    limit = TXS_PER_PAGE,
    recent = true,
    address,
  }: IFetchTransactionsOptions) {
    if ((transactions.value.nextPageUrl === null && !recent)) {
      return;
    }

    await watchUntilTruthy(() => middleware.value);

    const txs: ITransaction[] = await Promise.all([
      (recent || transactions.value.nextPageUrl === ''
        ? middleware.value.getTxByAccount(address, limit, 1)
        : fetchJson(`${activeNetwork.value.middlewareUrl}${transactions.value.nextPageUrl}`))
        .then(({ data, next }: any) => {
          const result = recent || transactions.value.nextPageUrl === '' ? data : camelcaseKeysDeep(data);
          if (!recent) {
            store.commit('setTransactionsNextPage', next);
          }
          return result;
        })
        .catch(() => []),
      store.dispatch('fetchPendingTransactions', address),
    ]);

    const minMicroTime = Math.min.apply(null, flatten(txs).map((tx: any) => tx.microTime));
    const amountOfTx = flatten(txs).length;
    flatten(await Promise.all([
      fetchTokensHistory(address, recent),
      store.dispatch('fetchTipWithdrawnTransactions', { recent, address }),
    ]))
      .forEach((f) => {
        if (minMicroTime < f.microTime || (amountOfTx === 0 && minMicroTime > f.microTime)) {
          txs.push(f);
        }
      });

    const sortedTransactions = orderBy(flatten(txs), ['microTime'], ['desc'])
      .map((tx) => ({ ...tx, transactionOwner: address }));
    const network = activeNetwork.value.networkId;
    if (transactions.value.pending[network]) {
      transactions.value.pending[network].forEach(({ hash }: any) => {
        if (sortedTransactions.some((tx: any) => tx.hash === hash && !tx.pending)) {
          store.commit('removePendingTransactionByHash', { hash, network });
        }
      });
    }
    store.commit('addTransactions', recent ? sortedTransactions.slice(0, limit) : sortedTransactions);
  }

  return {
    transactions,
    fetchTransactions,
  };
}
