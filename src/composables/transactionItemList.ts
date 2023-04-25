import { computed } from '@vue/composition-api';
import {
  IActiveMultisigTx,
  IDefaultComposableOptions,
  IDexContracts,
  ITokenList,
  ITransaction,
  ITx,
} from '../types';
import {
  AETERNITY_CONTRACT_ID,
  defaultTransactionSortingCallback,
  getInnerTransaction,
  isTxDex,
  pipe,
  TX_FUNCTIONS,
} from '../popup/utils';
import { usePendingMultisigTransaction } from './pendingMultisigTransaction';
import { useTransactionAndTokenFilter } from './transactionAndTokenFilter';
import { i18n } from '../store/plugins/languages';

interface TransactionItemList extends IDefaultComposableOptions {
  isMultisig?: boolean,
  token: string,
}

type ITransactionElement = ITransaction | IActiveMultisigTx

export function useTransactionList({
  store,
  isMultisig,
  token,
}: TransactionItemList) {
  const availableTokens = computed<ITokenList>(() => store.state.fungibleTokens.availableTokens);
  const transactions = computed(() => store.state.transactions);
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);

  const getAccountPendingTransactions = computed<IActiveMultisigTx[]>(
    () => store.getters.getAccountPendingTransactions,
  );

  const canLoadMore = computed(() => !!transactions.value.nextPageUrl);

  const {
    searchPhrase,
    displayMode,
    FILTER_MODE,
  } = useTransactionAndTokenFilter();

  const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

  function isFungibleTokenTx(tx: ITx) {
    return Object.keys(availableTokens.value).includes(tx.contractId);
  }

  function filterProperTransactions(transactionList: ITransactionElement[]) {
    return transactionList.filter((transaction) => {
      if (!token) {
        return true;
      }

      const innerTx = getInnerTransaction(transaction.tx!);
      if (token !== AETERNITY_CONTRACT_ID) {
        return innerTx?.contractId === token;
      }

      return !innerTx.contractId || !isFungibleTokenTx(innerTx);
    });
  }

  function filterTransactionByDisplayMode(transactionList: ITransactionElement[]) {
    return transactionList.filter((transaction) => {
      const direction = getTxDirection.value(transaction.tx);
      const isDex = isTxDex(transaction.tx!, getDexContracts.value);

      switch (displayMode.value.key) {
        case FILTER_MODE.all:
          return true;
        case FILTER_MODE.dex:
          return isDex;
        case FILTER_MODE.out:
          return direction === TX_FUNCTIONS.sent && !isDex;
        case FILTER_MODE.in:
          return direction === TX_FUNCTIONS.received;
        default:
          throw new Error(`${i18n.t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
      }
    });
  }

  function filterTransactionByPhrase(transactionList: ITransactionElement[]) {
    return transactionList.filter(
      (transaction) => !searchPhrase.value || getTxSymbol.value(transaction)
        .toLocaleLowerCase()
        .includes(searchPhrase.value.toLocaleLowerCase()),
    );
  }

  const loadedTransactionList = computed((): ITransactionElement[] => {
    const transactionList: ITransactionElement[] = [
      ...getAccountPendingTransactions.value,
      ...(transactions.value as any).loaded as ITransaction[],
    ];

    if (isMultisig && pendingMultisigTransaction.value?.tx) {
      transactionList.push(pendingMultisigTransaction.value);
    }

    return transactionList;
  });

  function sortTransactionByDate(transactionList: ITransactionElement[]) {
    return transactionList.sort(defaultTransactionSortingCallback);
  }

  const filteredTransactions = computed(
    () => pipe<ITransactionElement[]>([
      filterProperTransactions,
      filterTransactionByDisplayMode,
      filterTransactionByPhrase,
      sortTransactionByDate,
    ])(loadedTransactionList.value),
  );

  function getCommonTransaction(transaction: ITransactionElement): ITransaction | undefined {
    return (transaction as any).isMultisigTransaction
      ? undefined
      : transaction as ITransaction;
  }

  function getMultisigTransaction(transaction: ITransactionElement): IActiveMultisigTx | undefined {
    return (transaction as any).isMultisigTransaction
      ? transaction as IActiveMultisigTx
      : undefined;
  }

  return {
    filteredTransactions,
    getCommonTransaction,
    getMultisigTransaction,
    canLoadMore,
  };
}
