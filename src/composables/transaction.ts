import { computed, ref } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import type { Store } from 'vuex';
import type {
  ITransaction,
  ITokenTransactionComposable,
  TransactionType,
  IDexContracts,
  IAccount, IAccountLabeled,
} from '../types';
import * as TransactionResolver from '../popup/utils/transactionTokenInfoResolvers';
import {
  AETERNITY_SYMBOL,
  FUNCTION_TYPE_DEX,
  MAGNITUDE,
  RETURN_TYPE_OK,
  TRANSACTION_DIRECTION_RECEIVED,
  TRANSACTION_OWNERSHIP_STATUS,
  TX_FUNCTION_CLAIM,
  convertToken,
} from '../popup/utils';
import { i18n } from '../store/plugins/languages';
import { ITokenList } from '../types';

interface UseTransactionTokenOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
  initTransaction?: ITransaction
  showDetailedAllowanceInfo?: boolean
}

export function useTransaction({
  store,
  initTransaction,
  showDetailedAllowanceInfo = false,
}: UseTransactionTokenOptions) {
  const transaction = ref<ITransaction | undefined>(initTransaction);

  function setTransaction(newTransaction: ITransaction) {
    transaction.value = newTransaction;
  }

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const account = computed<IAccount>(() => store.getters.account);
  const accounts = computed<IAccount[]>(() => store.getters.accounts);

  const isTxAex9 = computed(() => store.getters.isTxAex9);
  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxType = computed(() => store.getters.getTxType);
  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);
  const getExplorerPath = computed(() => store.getters.getExplorerPath);
  const getPreferred = computed(() => store.getters['names/getPreferred']);

  const txType = computed<TransactionType>(() => getTxType.value(transaction.value));

  const isAllowance = computed(() => transaction.value
    && FUNCTION_TYPE_DEX.allowance.includes(transaction.value.tx.function)
    && availableTokens.value[transaction.value.tx.contractId]);

  const txOwnerAddress = computed(() => (
      transaction.value?.tx.accountId
      || transaction.value?.tx.callerId
  ));

  const ownershipStatus = computed(
    () => {
      if (account.value?.address === txOwnerAddress.value) {
        return TRANSACTION_OWNERSHIP_STATUS.current;
      }
      if (accounts.value?.find(({ address }) => address === txOwnerAddress.value)) {
        return TRANSACTION_OWNERSHIP_STATUS.subAccount;
      }
      return TRANSACTION_OWNERSHIP_STATUS.other;
    },
  );

  const transactionFunction = computed(() => {
    if (transaction.value) {
      const functionName = camelCase(transaction.value.tx.function || '');

      // TODO this line needs refactoring in TransactionResolver
      // @ts-ignore
      return TransactionResolver[functionName as string];
    }
    return null;
  });

  const direction = computed(() => (
      transaction.value?.tx.function === TX_FUNCTION_CLAIM
        ? TRANSACTION_DIRECTION_RECEIVED
        : getTxDirection.value(
          transaction.value,
          ownershipStatus.value !== TRANSACTION_OWNERSHIP_STATUS.current
            && txOwnerAddress.value,
        )
  ));

  const tokens = computed<ITokenTransactionComposable[]>(() => {
    if (
      transaction.value
      && transactionFunction.value
      && (!isAllowance.value || showDetailedAllowanceInfo)
    ) {
      return transactionFunction.value(transaction.value, availableTokens.value).tokens;
    }
    if (!transaction.value) return [];

    return [{
      ...transaction.value.tx || {},
      amount: isAllowance.value
        ? convertToken(transaction.value.tx.fee, -MAGNITUDE)
        : getTxAmountTotal.value(transaction.value),
      symbol: isAllowance.value ? AETERNITY_SYMBOL : getTxSymbol.value(transaction.value),
      isReceived: direction.value === TRANSACTION_DIRECTION_RECEIVED,
      isAe:
        isAllowance.value
        || (
          getTxSymbol.value(transaction.value) === AETERNITY_SYMBOL
          && !isTxAex9.value(transaction.value)
        ),
    }];
  });

  const isErrorTransaction = computed<boolean>(
    () => {
      if (!transaction.value) {
        return false;
      }
      const { returnType } = transaction.value.tx;
      return !!(returnType && returnType !== RETURN_TYPE_OK);
    },
  );

  const isDex = computed(() => transaction.value
    && getDexContracts.value && transaction.value.tx.contractId && (
    getDexContracts.value.router.includes(transaction.value.tx.contractId)
    || getDexContracts.value.wae.includes(transaction.value.tx.contractId)
  ));

  async function fetchOwnershipAccount(
    externalOwnerAddress: string | undefined,
  ): Promise<IAccountLabeled> {
    switch (ownershipStatus.value) {
      case TRANSACTION_OWNERSHIP_STATUS.current:
        return {
          ...account.value,
          label: i18n.t('transaction.overview.accountAddress'),
          url: getExplorerPath.value(account.value.address),
        };
      case TRANSACTION_OWNERSHIP_STATUS.subAccount: {
        const { accountId, callerId } = transaction.value?.tx || {};

        return accounts.value.find(({ address }) => [accountId, callerId].includes(address))!;
      }
      default: {
        const address = externalOwnerAddress || txOwnerAddress.value;

        return {
          name: getPreferred.value(address) || '',
          address: address!,
        };
      }
    }
  }

  return {
    txType,
    tokens,
    isAllowance,
    isErrorTransaction,
    isDex,
    txOwnerAddress,
    ownershipStatus,
    direction,
    fetchOwnershipAccount,
    setTransaction,
  };
}
