import { computed, ref, watch } from 'vue';
import { isEqual, remove } from 'lodash-es';
import type {
  AccountAddress,
  IAccount,
  ICommonTransaction,
  ITransaction,
} from '@/types';
import { PROTOCOLS, STORAGE_KEYS, TRANSACTION_CERTAINLY_MINED_TIME } from '@/constants';
import { pipe, removeDuplicatedTransactions, sortTransactionsByDate } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AE_MDW_TO_NODE_APPROX_DELAY_TIME } from '@/protocols/aeternity/config';

import { useAccounts } from './accounts';
import { useBalances } from './balances';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';
import { useAeSdk } from './aeSdk';
import { useFungibleTokens } from './fungibleTokens';

type AccountsTransactionList = Record<AccountAddress, ICommonTransaction[]>;

let initialized = false;

/**
 * First page of the transactions done for each of the accounts
 */
const accountsTransactionsLatest = useStorageRef<AccountsTransactionList>(
  {},
  STORAGE_KEYS.transactionsLatest,
);

/**
 * Local pending transactions added manually right after transferring assets.
 */
const accountsTransactionsPending = useStorageRef<AccountsTransactionList>(
  {},
  STORAGE_KEYS.transactionsPending,
);

const areLatestTransactionsUpdating = ref(false);

/**
 * All pending and latest fetched transactions as a flat list sorted by date.
 */
const allLatestTransactions = computed((): ICommonTransaction[] => {
  const transactionsArray = [
    ...Object.values(accountsTransactionsLatest.value).flat(),
    ...Object.values(accountsTransactionsPending.value).flat(),
  ];
  return pipe([
    removeDuplicatedTransactions,
    sortTransactionsByDate,
  ])(transactionsArray);
});

/**
 * Store, manage and update latest transactions for the purpose of displaying them on the dashboard
 * and any transaction list before loading the lists in the component scope.
 */
export function useLatestTransactionList() {
  const { accounts, getAccountByAddress } = useAccounts();
  const { activeNetwork } = useNetworks();
  const { balances } = useBalances();
  const { tokenBalances } = useFungibleTokens();
  const { waitTransactionMined } = useAeSdk();

  function removeAccountPendingTransaction(address: AccountAddress, hash: string) {
    accountsTransactionsPending.value[address] = remove(
      accountsTransactionsPending.value[address],
      (transaction) => hash === transaction.hash,
    );
  }

  async function loadAccountLatestTransactions({ address, protocol }: IAccount) {
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    const { regularTransactions } = await adapter.fetchAccountTransactions(address);

    if (regularTransactions.length) {
      accountsTransactionsLatest.value[address] = regularTransactions;

      if (accountsTransactionsPending.value[address]?.length) {
        regularTransactions.forEach(({ hash }) => removeAccountPendingTransaction(address, hash));
      }
    }

    return true; // Required to be able to use Promise.all
  }

  /**
   * Loads all latest transactions for every account.
   */
  async function loadAllLatestTransactions() {
    if (!areLatestTransactionsUpdating.value) {
      areLatestTransactionsUpdating.value = true;
      await Promise.all(accounts.value.map(
        async (account) => loadAccountLatestTransactions(account),
      ));
      areLatestTransactionsUpdating.value = false;
    }
  }

  /**
   * Add temporary pending transaction and remove it when it's mined.
   * For now this is usable only with Aeternity protocol
   */
  async function addAccountPendingTransaction(address: AccountAddress, transaction: ITransaction) {
    const account = getAccountByAddress(address);
    if (account?.protocol === PROTOCOLS.aeternity && transaction?.hash) {
      if (!accountsTransactionsPending.value[address]) {
        accountsTransactionsPending.value[address] = [];
      }
      accountsTransactionsPending.value[address].push(transaction);

      try {
        await waitTransactionMined(transaction.hash);
        loadAccountLatestTransactions(account);
      } finally {
        removeAccountPendingTransaction(address, transaction.hash);
      }
    }
  }

  if (!initialized) {
    initialized = true;
    loadAllLatestTransactions();

    /**
     * Remove old pending transactions that we can consider as already mined.
     * This prevents situation where user creates transaction and closes the app/extension
     * immediately so the `waitTransactionMined` couldn't work properly.
     */
    setInterval(() => {
      Object.entries(accountsTransactionsPending.value)
        .forEach(([accountAddress, transactionList]) => {
          transactionList.forEach(({ hash, microTime }) => {
            if (Date.now() - (microTime || 0) > TRANSACTION_CERTAINLY_MINED_TIME) {
              removeAccountPendingTransaction(accountAddress, hash);
            }
          });
        });
    }, 60000);

    /**
     * To avoid unnecessary data transfers, instead of polling data at intervals,
     * we only load account transactions when the account balance changes.
     */
    watch(
      balances,
      (newBalances, oldBalances) => {
        accounts.value.forEach((account) => {
          const oldBalance = oldBalances[account.address];
          const newBalance = newBalances[account.address];
          if (oldBalance && newBalance && !newBalance.isEqualTo(oldBalance)) {
            setTimeout(
              () => loadAccountLatestTransactions(account),
              (account.protocol === PROTOCOLS.aeternity) ? AE_MDW_TO_NODE_APPROX_DELAY_TIME : 0,
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
          loadAllLatestTransactions();
        }
      },
      { deep: true },
    );

    /**
     * Reset all cached transactions and fetch again when user switched the network.
     */
    watch(activeNetwork, (newNetwork, oldNetwork) => {
      if (newNetwork.name !== oldNetwork.name) {
        accountsTransactionsLatest.value = {};
        accountsTransactionsPending.value = {};
        loadAllLatestTransactions();
      }
    }, { deep: true });
  }

  return {
    accountsTransactionsLatest,
    accountsTransactionsPending,
    areLatestTransactionsUpdating,
    allLatestTransactions,
    addAccountPendingTransaction,
    loadAllLatestTransactions,
  };
}
