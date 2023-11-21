import {
  isEqual,
  orderBy,
  uniqBy,
} from 'lodash-es';
import { ref, watch } from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';
import type {
  Protocol,
  ITransaction,
  ITransactionsState,
  IAccountTransactionsState,
} from '@/types';
import {
  PROTOCOLS,
  TRANSACTIONS_LOCAL_STORAGE_KEY,
  TXS_PER_PAGE,
} from '@/constants';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils';

import { AE_MDW_TO_NODE_APPROX_DELAY_TIME, AEX9_TRANSFER_EVENT } from '@/protocols/aeternity/config';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useMiddleware } from './middleware';
import { useBalances } from './balances';
import { createNetworkWatcher } from './networks';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useFungibleTokens } from './fungibleTokens';

const { onNetworkChange } = createNetworkWatcher();

const transactions = ref<IAccountTransactionsState>({});
let isInitialized = false;

function generateEmptyTransactionState(): ITransactionsState {
  return {
    loaded: [],
    nextPageUrl: '',
    localPendingTransaction: null,
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

function setTransactionsNextPage(address: string, url: string | null) {
  transactions.value[address].nextPageUrl = url;
}

export function useTransactionList() {
  const { nodeNetworkId, getAeSdk } = useAeSdk();
  const { isLoggedIn, accounts, getAccountByAddress } = useAccounts();
  const { getMiddleware } = useMiddleware();
  const { balances } = useBalances();

  const { tokenBalances } = useFungibleTokens();

  function getAccountAllTransactions(address: Encoded.AccountAddress) {
    if (!isLoggedIn) {
      return [];
    }
    const { localPendingTransaction, loaded } = getAccountTransactionsState(address);
    const allTransactions = [...loaded];
    if (localPendingTransaction) {
      allTransactions.push(localPendingTransaction);
    }
    return allTransactions;
  }

  function getTransactionByHash(address: Encoded.AccountAddress, hash: string) {
    return accounts.value.flatMap(
      (account) => getAccountAllTransactions(account.address),
    ).find((transaction) => transaction.hash === hash);
  }

  function setPendingTransactionSentByHash(address: Encoded.AccountAddress, hash: string) {
    if (
      transactions.value[address].localPendingTransaction !== null
      && transactions.value[address].localPendingTransaction?.hash === hash
    ) {
      (transactions.value[address].localPendingTransaction as ITransaction).sent = true;
    }
  }

  function removePendingTransactionByAccount(address: Encoded.AccountAddress, hash: string) {
    if (transactions.value[address].localPendingTransaction?.hash === hash) {
      transactions.value[address].localPendingTransaction = null;
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
    transactions.value[address].localPendingTransaction = transaction;
    waitTransactionMined(address, transaction.hash);
  }

  async function fetchTransactions(
    address: Encoded.AccountAddress,
    newest?: boolean,
    isMultisig?: boolean,
  ): Promise<ITransaction[]> {
    const { protocol } = isMultisig
      ? { protocol: PROTOCOLS.aeternity as Protocol }
      : getAccountByAddress(address) || {};
    await getAeSdk(); // Ensure the `nodeNetworkId` is established

    ensureAccountTransactionStateExists(address);
    const transactionState = transactions.value[address];
    if (!protocol) {
      return [];
    }

    const adapter = ProtocolAdapterFactory.getAdapter(protocol);

    const response = await adapter.fetchTransactions(
      address,
      newest ? '' : transactionState.nextPageUrl,
    );

    const pendingTransactions = response.pendingTransactions
      ?.filter(
        (transaction: ITransaction) => (
          transactionState.localPendingTransaction?.hash !== transaction?.hash
        ),
      ) || [];

    const lastPendingTransaction = pendingTransactions?.[pendingTransactions.length - 1];
    // DEX transaction is represented in 3 objects, only last one should be used
    // this condition checking edge case when not all 3 objects in one chunk
    if (lastPendingTransaction?.type === AEX9_TRANSFER_EVENT) {
      const middleware = await getMiddleware();
      pendingTransactions[pendingTransactions.length - 1] = (
        await middleware.getTx(lastPendingTransaction?.payload.txHash)
      );
    }
    if (!newest) {
      setTransactionsNextPage(address as string, response.nextPageParams);
    }

    let preparedTransactions = [
      ...pendingTransactions,
      ...(response.regularTransactions || []),
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
    response.tipWithdrawnTransactions?.forEach((f) => {
      if (
        f.microTime
        && (
          minMicroTime < f.microTime
          || (preparedTransactions.length === 0 && minMicroTime > f.microTime)
        )
      ) {
        preparedTransactions.push({ ...f, transactionOwner: address });
      }
    });

    preparedTransactions = orderBy(preparedTransactions, ['microTime'], ['desc']);

    const { hash: localPendingTransactionHash } = transactionState.localPendingTransaction || {};

    if (preparedTransactions.some(
      (tx) => tx.hash === localPendingTransactionHash && !tx.pending,
    )) {
      removePendingTransactionByAccount(address, localPendingTransactionHash!);
    }

    (transactions.value[address]?.loaded?.filter(({ pending }) => pending) || [])
      .forEach((transaction) => {
        const newTransaction = preparedTransactions
          .find((tx) => tx.hash === transaction.hash && !tx.pending);
        if (newTransaction) {
          updateAccountTransaction(address, newTransaction);
        }
      });

    preparedTransactions = newest || transactionState.nextPageUrl === ''
      ? preparedTransactions.slice(0, TXS_PER_PAGE)
      : preparedTransactions;

    transactions.value[address].loaded = uniqBy(
      [...transactions.value[address]?.loaded, ...preparedTransactions],
      'hash',
    );

    return preparedTransactions;
  }

  async function fetchAllPendingTransactions() {
    await Promise.all(
      accounts.value.map(
        (account) => fetchTransactions(account.address, true),
      ),
    );
  }

  async function updateAllTransactions() {
    await Promise.all(accounts.value.map((account) => fetchTransactions(account.address, true)));
  }

  watch(nodeNetworkId, (value, oldValue) => {
    if (value) {
      setLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, oldValue!], transactions.value);
      transactions.value = getLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, value!]) || {};

      Object.entries(transactions.value).forEach(([address, transactionState]) => {
        const transaction = transactionState.localPendingTransaction;
        if (transaction && !transaction.sent) {
          if (Date.now() - (transaction.microTime || 0) > 600000) {
            removePendingTransactionByAccount(
              address as Encoded.AccountAddress,
              transaction.hash,
            );
          } else {
            waitTransactionMined(address as Encoded.AccountAddress, transaction.hash);
          }
        }
      });
    }
  });

  watch(transactions, (value) => {
    setLocalStorageItem([TRANSACTIONS_LOCAL_STORAGE_KEY, nodeNetworkId.value!], value);
  }, { deep: true, immediate: true });

  /**
   * To avoid unnecessary data transfers instead of constant polling
   * we are fetching the transactions only if the balance of an account changes.
   */
  watch(
    balances,
    (newBalances, oldBalances) => {
      accounts.value.forEach((account) => {
        const oldBalance = oldBalances[account.address];
        const newBalance = newBalances[account.address];
        if (oldBalance && newBalance && !newBalance.isEqualTo(oldBalance)) {
          setTimeout(
            () => fetchTransactions(account.address, true),
            AE_MDW_TO_NODE_APPROX_DELAY_TIME,
          );
        }
      });
    },
    { deep: true },
  );

  watch(
    tokenBalances,
    (oldTokens, newTokens) => {
      if (!isEqual(oldTokens, newTokens)) {
        updateAllTransactions();
      }
    },
    { deep: true },
  );

  onNetworkChange(() => {
    updateAllTransactions();
  });

  (() => {
    if (!isInitialized) {
      isInitialized = true;
      updateAllTransactions();
    }
  })();

  return {
    transactions,
    fetchTransactions,
    getAccountAllTransactions,
    getTransactionByHash,
    getAccountTransactionsState,
    upsertCustomPendingTransactionForAccount,
    updateAccountTransaction,
    fetchAllPendingTransactions,
  };
}
