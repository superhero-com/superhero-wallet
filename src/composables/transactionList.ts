import { orderBy, uniqBy } from 'lodash-es';
import { ref, watch } from 'vue';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import type {
  ITransaction,
  ITransactionsState,
  IAccountTransactionsState,
  IDefaultComposableOptions,
} from '@/types';
import {
  TRANSACTIONS_LOCAL_STORAGE_KEY,
  TX_DIRECTION,
} from '@/constants';
import {
  fetchJson,
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils';
import JsonBig from '@/lib/json-big';
import { AEX9_TRANSFER_EVENT } from '@/protocols/aeternity/config';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import { useAccounts } from './accounts';
import { useMiddleware } from './middleware';
import { useAeSdk } from './aeSdk';

const transactions = ref<IAccountTransactionsState>({});

function generateEmptyTransactionState(): ITransactionsState {
  return {
    loaded: [],
    nextPageUrl: '',
    pending: {},
    tipWithdrawnTransactions: [],
  };
}

function getAccountTransactionsState(address: Encoded.AccountAddress): ITransactionsState {
  return transactions.value[address] || generateEmptyTransactionState();
}

function ensureAccountTransactionStateExists(address: Encoded.AccountAddress) {
  if (!transactions.value[address]) {
    transactions.value[address] = generateEmptyTransactionState();
  }
}

function updateAccountTransaction(address: Encoded.AccountAddress, transaction: ITransaction) {
  const transactionIndex = transactions.value[address]?.loaded?.findIndex(
    (tr) => tr.hash === transaction.hash,
  );

  if (transactionIndex !== undefined && transactionIndex >= 0) {
    transactions.value[address].loaded[transactionIndex] = transaction;
  } else {
    ensureAccountTransactionStateExists(address);
    transactions.value[address].loaded.push(transaction);
  }
}

const setTransactionsNextPage = (address: Encoded.AccountAddress, url: string) => {
  transactions.value[address].nextPageUrl = url;
};

export function useTransactionList({ store }: IDefaultComposableOptions) {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { nodeNetworkId, getAeSdk } = useAeSdk({ store });
  const { isLoggedIn, accounts } = useAccounts({ store });
  const {
    fetchFromMiddlewareCamelCased,
    getMiddleware,
  } = useMiddleware();

  function getAccountAllTransactions(address: Encoded.AccountAddress) {
    if (!isLoggedIn) {
      return [];
    }
    const { pending, loaded } = getAccountTransactionsState(address);

    return [...loaded, ...((pending || {})[nodeNetworkId.value!] || [])];
  }

  function getTransactionByHash(address: Encoded.AccountAddress, hash: string) {
    return accounts.value.flatMap(
      (account) => getAccountAllTransactions(account.address),
    ).find((transaction) => transaction.hash === hash);
  }

  function setPendingTransactionSentByHash(address: Encoded.AccountAddress, hash: string) {
    const index = transactions.value[address].pending[nodeNetworkId.value!]
      ?.findIndex((transaction) => transaction.hash === hash);

    if (index !== undefined && index !== -1) {
      transactions.value[address]
        .pending[nodeNetworkId.value!][index][TX_DIRECTION.sent] = true;
    }
  }

  function removePendingTransactionByAccount(address: Encoded.AccountAddress, hash: string) {
    const pendingTransactionForAccount: ITransaction[] = (
      transactions.value[address]?.pending?.[nodeNetworkId.value!] || []
    );

    if (pendingTransactionForAccount.length) {
      transactions.value[address].pending[nodeNetworkId.value!] = (
        pendingTransactionForAccount.filter((transaction) => transaction.hash !== hash)
      );
    }
  }

  async function waitTransactionMined(address: Encoded.AccountAddress, hash?: Encoded.TxHash) {
    if (hash) {
      try {
        const aeSdk = await getAeSdk();
        await aeSdk.poll(hash);
        setPendingTransactionSentByHash(address, hash);
      } catch (error) {
        removePendingTransactionByAccount(address, hash);
      }
    }
  }

  function upsertCustomPendingTransactionForAccount(
    address: Encoded.AccountAddress,
    transaction: ITransaction,
  ) {
    ensureAccountTransactionStateExists(address);
    transactions.value[address].pending[nodeNetworkId.value!] = [transaction];
    waitTransactionMined(address, transaction.hash);
  }

  async function fetchTransactionsFromMiddleware(
    transactionState: ITransactionsState,
    address: Encoded.AccountAddress,
    recent: boolean,
    limit: number,
  ) {
    const url = (recent || transactionState.nextPageUrl === '')
      ? `/v2/accounts/${address}/activities?limit=${limit}`
      : transactionState.nextPageUrl!;

    try {
      const { data, next } = await fetchFromMiddlewareCamelCased(url);
      if (!recent) {
        setTransactionsNextPage(address, next);
      }
      return data || [];
    } catch (error) {
      return [];
    }
  }

  async function fetchPendingTransactions(address: Encoded.AccountAddress) {
    const sdk = await getAeSdk();

    try {
      const fetchedPendingTransaction = (
        await sdk.api.getPendingAccountTransactionsByPubkey(address)
      );
      const transactionState = getAccountTransactionsState(address);

      return JsonBig.parse(JsonBig.stringify(
        fetchedPendingTransaction?.transactions || [],
      ))
        .filter(
          (transaction: ITransaction) => !transactionState.pending[nodeNetworkId.value!]?.find(
            (tx) => tx?.hash === transaction?.hash,
          ),
        ).map((transaction: ITransaction) => ({ ...transaction, pending: true }));
    } catch (error) {
      return [];
    }
  }

  async function fetchTipWithdrawnTransactions(address: Encoded.AccountAddress, recent: boolean) {
    try {
      await getAeSdk();
      const response = await fetchJson(
        `${aeActiveNetworkSettings.value.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn${recent ? '&limit=5' : ''}`,
      );
      if (response.message) {
        return [];
      }
      // TODO prepare interface for response
      const tipWithdrawnTransactions: ITransaction[] = (response as any[]).map(({
        amount,
        contract,
        height,
        data: { tx },
        ...t
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

      return tipWithdrawnTransactions;
    } catch (error) {
      return [];
    }
  }

  async function fetchTransactions(
    limit: number,
    recent: boolean,
    address: Encoded.AccountAddress,
  ): Promise<ITransaction[]> {
    await getAeSdk(); // Ensure the `nodeNetworkId` is established

    ensureAccountTransactionStateExists(address);
    const transactionState = transactions.value[address];

    if (transactionState.nextPageUrl === null && !recent) {
      return [];
    }

    const [
      regularTransactions,
      pendingTransactions,
      tipWithdrawnTransactions,
    ] = await Promise.all([
      fetchTransactionsFromMiddleware(transactionState, address, recent, limit),
      fetchPendingTransactions(address),
      fetchTipWithdrawnTransactions(address, recent),
    ]);

    const lastRegularTransaction = regularTransactions?.[regularTransactions.length - 1];
    // DEX transaction is represented in 3 objects, only last one should be used
    // this condition checking edge case when not all 3 objects in one chunk
    if (lastRegularTransaction?.type === AEX9_TRANSFER_EVENT) {
      const middleware = await getMiddleware();
      regularTransactions[regularTransactions.length - 1] = (
        await middleware.getTx(lastRegularTransaction.payload.txHash)
      );
    }

    let preparedTransactions = [
      ...pendingTransactions,
      ...regularTransactions,
    ]
      .filter(({ type }) => !type?.startsWith('Internal'))
      .map((transaction) => ({
        ...(transaction.payload || transaction),
        transactionOwner: address,
        ...(transaction.type === AEX9_TRANSFER_EVENT
          ? {
            tx: {
              ...transaction.payload,
              callerId: transaction.payload.senderId,
              type: 'ContractCallTx',
            },
            hash: transaction.payload.txHash,
            incomplete: true,
          } as ITransaction
          : {}),
      }));

    preparedTransactions = uniqBy(preparedTransactions.reverse(), 'hash').reverse();
    const minMicroTime = Math.min.apply(null, preparedTransactions.map((tx) => tx.microTime));
    tipWithdrawnTransactions.forEach((f) => {
      if (f.microTime
        && (
          minMicroTime < f.microTime
          || (preparedTransactions.length === 0 && minMicroTime > f.microTime))
      ) {
        preparedTransactions.push({ ...f, transactionOwner: address });
      }
    });
    preparedTransactions = orderBy(preparedTransactions, ['microTime'], ['desc']);

    const oldPendingTransactionForAccount: ITransaction[] = (
      transactions.value[address]?.pending?.[nodeNetworkId.value!] || []
    );

    oldPendingTransactionForAccount.forEach(({ hash }) => {
      if (preparedTransactions.some((tx) => tx.hash === hash && !tx.pending)) {
        removePendingTransactionByAccount(address, hash);
      }
    });

    (transactions.value[address]?.loaded?.filter(({ pending }) => pending) || [])
      .forEach((transaction) => {
        const newTransaction = preparedTransactions
          .find((tx) => tx.hash === transaction.hash && !tx.pending);
        if (newTransaction) {
          updateAccountTransaction(address, newTransaction);
        }
      });

    preparedTransactions = recent
      ? preparedTransactions.slice(0, limit)
      : preparedTransactions;

    transactions.value[address].loaded = uniqBy(
      [...transactions.value[address].loaded, ...preparedTransactions],
      'hash',
    );

    return preparedTransactions;
  }

  async function fetchAllPendingTransactions() {
    await Promise.all(
      accounts.value.map(
        (account) => fetchTransactions(0, false, account.address),
      ),
    );
  }

  watch(nodeNetworkId, (value, oldValue) => {
    if (value) {
      setLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, oldValue!], transactions.value);
      transactions.value = getLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, value!]) || {};

      Object.entries(transactions.value).forEach(([address, transactionState]) => {
        (transactionState.pending?.[nodeNetworkId.value!])?.filter(({ sent = false }) => !sent)
          .forEach((transaction) => {
            if (Date.now() - (transaction.microTime || 0) > 600000) {
              removePendingTransactionByAccount(
                address as Encoded.AccountAddress,
                transaction.hash,
              );
            } else {
              waitTransactionMined(address as Encoded.AccountAddress, transaction.hash);
            }
          });
      });
    }
  });

  watch(transactions, (value) => {
    setLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, nodeNetworkId.value!], value);
  }, { deep: true, immediate: true });

  return {
    getAccountAllTransactions,
    transactions,
    getTransactionByHash,
    getAccountTransactionsState,
    fetchTransactions,
    upsertCustomPendingTransactionForAccount,
    updateAccountTransaction,
    fetchPendingTransactions,
    fetchAllPendingTransactions,
  };
}
