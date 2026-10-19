import { computed, ref, watch } from 'vue';
import { isEqual } from 'lodash-es';
import type {
  AccountAddress,
  IAccount,
  ICommonTransaction,
  ITokenBalance,
  ITransaction,
  ITx,
} from '@/types';
import { STORAGE_KEYS } from '@/constants';
import {
  pipe,
  removeDuplicatedTransactions,
  sortTransactionsByDate,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { useAccounts } from './accounts';
import { useBalances } from './balances';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';
import { useFungibleTokens } from './fungibleTokens';

type AccountsTransactionList = Record<AccountAddress, ICommonTransaction[]>;

let composableInitialized = false;

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
let isLatestTransactionsReloadRequested = false;

function getTokenBalancesByAccountKey(tokenBalanceList: ITokenBalance[]) {
  const result: Record<string, ITokenBalance[]> = {};
  tokenBalanceList.forEach((tokenBalance) => {
    const key = `${tokenBalance.protocol}:${tokenBalance.address}`;
    result[key] ??= [];
    result[key].push(tokenBalance);
  });
  return result;
}

/**
 * The account whose nonce the transaction uses.
 */
function getTransactionSender(tx?: ITx) {
  return tx?.callerId || tx?.senderId || tx?.accountId || tx?.ownerId;
}

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
  const { accounts, getAccountByProtocolAndAddress } = useAccounts();
  const { activeNetwork, onNetworkChange } = useNetworks();
  const { balances } = useBalances();
  const { tokenBalances } = useFungibleTokens();

  function removeAccountPendingTransactionByHash(address: AccountAddress, hash: string) {
    accountsTransactionsPending.value[address] = (
      accountsTransactionsPending.value[address] || []
    ).filter((transaction) => hash !== transaction.hash);
  }

  /**
   * Remove pending transactions that can't be mined anymore,
   * because the account mined another one with the same nonce (e.g. sped up).
   */
  function removeAccountPendingTransactionByNonce(
    address: AccountAddress,
    { protocol, tx }: ITransaction,
  ) {
    // Incoming transactions carry the nonce of the sender
    if (tx?.nonce == null || getTransactionSender(tx) !== address) return;
    accountsTransactionsPending.value[address] = (
      accountsTransactionsPending.value[address] || []
    ).filter((transaction) => (
      transaction.protocol !== protocol
      // Etherscan returns the nonce as a string
      || String(transaction.tx?.nonce) !== String(tx.nonce)
    ));
  }
  async function loadAccountLatestTransactions({ address, protocol }: IAccount) {
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    const currentNetworkName = activeNetwork.value.name;
    const {
      regularTransactions,
      pendingTransactions,
    } = await adapter.fetchAccountTransactions(address);

    // This is necessary in case the user switches between networks faster,
    // than transactions are returned (limitations of the free Ethereum middleware)
    if (currentNetworkName !== activeNetwork.value.name) {
      return true;
    }

    if (
      regularTransactions?.length
      || pendingTransactions?.length
    ) {
      accountsTransactionsLatest.value[address] = [
        // Ethereum, BNB and Polygon accounts share the address
        ...(accountsTransactionsLatest.value[address] || [])
          .filter((transaction) => transaction.protocol !== protocol),
        ...regularTransactions,
        ...(pendingTransactions || []),
      ];

      if (accountsTransactionsPending.value[address]?.length) {
        regularTransactions.forEach(
          ({ hash }) => removeAccountPendingTransactionByHash(address, hash),
        );
        regularTransactions.forEach(
          (transaction) => removeAccountPendingTransactionByNonce(address, transaction),
        );
      }
    }

    return true; // Required to be able to use Promise.all
  }

  /**
   * Loads all latest transactions for every account.
   */
  async function loadAllLatestTransactions() {
    if (areLatestTransactionsUpdating.value) {
      // E.g. after a network switch the running batch is discarded
      isLatestTransactionsReloadRequested = true;
      return;
    }
    areLatestTransactionsUpdating.value = true;
    try {
      do {
        isLatestTransactionsReloadRequested = false;
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(accounts.value.map(
          async (account) => loadAccountLatestTransactions(account),
        ));
      } while (isLatestTransactionsReloadRequested);
    } finally {
      areLatestTransactionsUpdating.value = false;
    }
  }

  /**
   * Add temporary pending transaction and remove it when it's mined.
   */
  async function addAccountPendingTransaction(address: AccountAddress, transaction: ITransaction) {
    const account = getAccountByProtocolAndAddress(transaction.protocol, address);
    if (account && transaction?.hash) {
      if (!accountsTransactionsPending.value[address]) {
        accountsTransactionsPending.value[address] = [];
      }
      accountsTransactionsPending.value[address].push({ ...transaction, microTime: Date.now() });

      try {
        await ProtocolAdapterFactory
          .getAdapter(account.protocol)
          .waitTransactionMined(transaction.hash);
        loadAccountLatestTransactions(account);
      } finally {
        removeAccountPendingTransactionByHash(address, transaction.hash);
      }
    }
  }

  if (!composableInitialized) {
    composableInitialized = true;

    loadAllLatestTransactions();

    /**
     * Refresh account transactions lists if any of the transactions is pending.
     */
    setInterval(() => {
      Object.entries(accountsTransactionsLatest.value)
        .forEach(([accountAddress, transactionList]) => {
          new Set(
            transactionList
              .filter(({ pending }) => !!pending)
              .map(({ protocol }) => protocol),
          ).forEach((accProtocol) => {
            const acc = getAccountByProtocolAndAddress(accProtocol, accountAddress);
            if (acc) loadAccountLatestTransactions(acc);
          });
        });
    }, 60000);

    /**
     * To avoid unnecessary data transfers, instead of polling data at intervals,
     * we only load account transactions when the account balance changes.
     */
    // `balances`/`tokenBalances` are always reassigned wholesale (never
    // mutated in place, verified repo-wide), so a shallow watch already
    // fires on every change -- `deep: true` was only adding an O(n) traversal
    // (including each BigNumber's internals) on every 8s/30s poll tick.
    watch(
      balances,
      (newBalances, oldBalances) => {
        accounts.value.forEach((account) => {
          const oldBalance = oldBalances[account.protocol]?.[account.address];
          const newBalance = newBalances[account.protocol]?.[account.address];
          if (oldBalance && newBalance && !newBalance.isEqualTo(oldBalance)) {
            setTimeout(
              () => loadAccountLatestTransactions(account),
              ProtocolAdapterFactory.getAdapter(account.protocol).mdwToNodeApproxDelayTime,
            );
          }
        });
      },
    );

    watch(
      tokenBalances,
      (newTokens, oldTokens) => {
        const newTokensByAccount = getTokenBalancesByAccountKey(newTokens);
        const oldTokensByAccount = getTokenBalancesByAccountKey(oldTokens);

        accounts.value.forEach((account) => {
          const key = `${account.protocol}:${account.address}`;
          if (!isEqual(newTokensByAccount[key] || [], oldTokensByAccount[key] || [])) {
            loadAccountLatestTransactions(account);
          }
        });
      },
    );

    /**
     * Reset all cached transactions and fetch again when user switched the network.
     */
    onNetworkChange((newNetwork, oldNetwork) => {
      if (newNetwork.name !== oldNetwork.name) {
        accountsTransactionsLatest.value = {};
        accountsTransactionsPending.value = {};
        loadAllLatestTransactions();
      }
    });
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
