import { computed, ref } from '@vue/composition-api';
import type {
  IAccount,
  IAccountLabeled,
  IDexContracts,
  ITokenList,
  TxFunctionRaw,
  ITx,
  IDefaultComposableOptions,
} from '../types';
import { i18n } from '../store/plugins/languages';
import {
  FUNCTION_TYPE_DEX,
  FUNCTION_TYPE_MULTISIG,
  RETURN_TYPE_OK,
  TRANSACTION_OWNERSHIP_STATUS,
  TX_FUNCTIONS,
  getTxType,
  isContainingNestedTx,
  getInnerTransaction,
} from '../popup/utils';

interface UseTransactionOptions extends IDefaultComposableOptions {
  tx?: ITx
  externalAddress?: string
}

export function useTransactionTx({
  store,
  tx,
  externalAddress,
}: UseTransactionOptions) {
  const outerTx = ref<ITx | undefined>(tx);
  const innerTx = ref<ITx | undefined>(tx ? getInnerTransaction(tx) : undefined);

  function setTransactionTx(newTx: ITx) {
    outerTx.value = newTx;
    innerTx.value = getInnerTransaction(newTx);
  }

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const account = computed<IAccount>(() => store.getters.account);
  const accounts = computed<IAccount[]>(() => store.getters.accounts);

  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);
  const getExplorerPath = computed(() => store.getters.getExplorerPath);
  const getPreferred = computed(() => store.getters['names/getPreferred']);

  const hasNestedTx = computed(() => outerTx.value && isContainingNestedTx(outerTx.value));

  const txType = computed(() => innerTx.value ? getTxType(innerTx.value) : null);
  const outerTxType = computed(() => outerTx.value ? getTxType(outerTx.value) : null);

  const isAllowance = computed((): boolean => (
    !!innerTx.value?.function
    && FUNCTION_TYPE_DEX.allowance.includes(innerTx.value.function as TxFunctionRaw)
    && !!availableTokens.value[innerTx.value.contractId]
  ));

  const isMultisig = computed((): boolean => (
    !!outerTx.value?.function
    && (
      Object.values(FUNCTION_TYPE_MULTISIG).includes(outerTx.value.function as TxFunctionRaw)
      || !!outerTx.value.payerId
    )
  ));

  const isErrorTransaction = computed(
    (): boolean => {
      if (!outerTx.value) {
        return false;
      }
      const { returnType } = outerTx.value;
      return !!(returnType && returnType !== RETURN_TYPE_OK);
    },
  );

  const isDex = computed((): boolean => {
    const { wae, router } = getDexContracts.value;

    return !!(
      innerTx.value?.contractId
      && [...wae, ...router].includes(innerTx.value.contractId)
    );
  });

  const txOwnerAddress = computed(() => innerTx.value?.accountId || innerTx.value?.callerId);

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

  const direction = computed(() => {
    if (outerTx.value?.payerId === account.value.address) {
      return TX_FUNCTIONS.sent;
    }
    return innerTx.value?.function === TX_FUNCTIONS.claim
      ? TX_FUNCTIONS.received
      : getTxDirection.value(
        innerTx.value,
        externalAddress
        || (
          ownershipStatus.value !== TRANSACTION_OWNERSHIP_STATUS.current
          && txOwnerAddress.value
        ),
      );
  });

  function getOwnershipAccount(
    externalOwnerAddress: string | undefined,
  ): IAccountLabeled {
    switch (ownershipStatus.value) {
      case TRANSACTION_OWNERSHIP_STATUS.current:
        return {
          ...account.value,
          label: i18n.t('transaction.overview.accountAddress'),
          url: getExplorerPath.value(account.value.address),
        };
      case TRANSACTION_OWNERSHIP_STATUS.subAccount: {
        const { accountId, callerId } = innerTx.value || {};

        return accounts.value.find(({ address }) => [accountId, callerId].includes(address))!;
      }
      default: {
        const address = externalOwnerAddress || txOwnerAddress.value;

        return {
          name: getPreferred.value(address) || '',
          address,
        };
      }
    }
  }

  return {
    outerTxType,
    hasNestedTx,
    txType,
    innerTx: innerTx as any,
    isAllowance,
    isErrorTransaction,
    isDex,
    isMultisig,
    direction,
    getOwnershipAccount,
    setTransactionTx,
  };
}
