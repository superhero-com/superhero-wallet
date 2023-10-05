import { computed, ref } from 'vue';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import type {
  IAccountOverview,
  IDefaultComposableOptions,
  ITx,
  ObjectValues,
  TxFunctionRaw,
  TxType,
} from '@/types';
import {
  includes,
  getTxFunctionLabel,
  getTxTypeLabel,
  getTxTypeListLabel,
} from '@/utils';
import { TX_DIRECTION } from '@/constants';
import {
  AE_TRANSACTION_OWNERSHIP_STATUS,
  TX_RETURN_TYPE_OK,
  TX_FUNCTIONS,
  TX_FUNCTIONS_MULTISIG,
} from '@/protocols/aeternity/config';
import {
  getInnerTransaction,
  getOwnershipStatus,
  getTxDirection,
  getTxOwnerAddress,
  getTxTag,
  isContainingNestedTx,
  isTxDex,
  isTxFunctionDexAddLiquidity,
  isTxFunctionDexAllowance,
  isTxFunctionDexRemoveLiquidity,
  isTxFunctionDexPool,
} from '@/protocols/aeternity/helpers';
import { useFungibleTokens } from '@/composables/fungibleTokens';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';

import { useTippingContracts } from './tippingContracts';

interface UseTransactionOptions extends IDefaultComposableOptions {
  tx?: ITx;
  externalAddress?: Encoded.AccountAddress;
}

export function useTransactionTx({
  store,
  tx,
  externalAddress,
}: UseTransactionOptions) {
  const { dexContracts } = useAeSdk({ store });
  const { accounts, activeAccount } = useAccounts();
  const { tippingContractAddresses } = useTippingContracts({ store });
  const { availableTokens } = useFungibleTokens({ store });

  const outerTx = ref<ITx | undefined>(tx);
  const innerTx = ref<ITx | undefined>(tx ? getInnerTransaction(tx) : undefined);
  const ownerAddress = ref<Encoded.AccountAddress | undefined>(externalAddress);

  const hasNestedTx = computed(() => outerTx.value && isContainingNestedTx(outerTx.value));
  const innerTxTag = computed((): Tag | null => innerTx.value ? getTxTag(innerTx.value) : null);
  const outerTxTag = computed((): Tag | null => tx ? getTxTag(tx) : null);
  const txType = computed(
    (): TxType | null => outerTxTag.value ? Tag[outerTxTag.value] as TxType : null,
  );

  /**
   * Transaction TX type value converted into human readable label
   * displayed on the transaction details page.
   */
  const txTypeLabel = computed((): string => txType.value ? getTxTypeLabel(txType.value) : '');

  /**
   * Transaction TX type value converted into human readable label
   * displayed on the transaction lists.
   */
  const txTypeListLabel = computed((): string => {
    const listTranslation = (txType.value) ? getTxTypeListLabel(txType.value) : '';
    return listTranslation ?? txTypeLabel.value;
  });

  /**
   * Transaction TX function value converted into human readable label
   */
  const txFunctionLabel = computed(
    (): string => (outerTx.value?.function)
      ? getTxFunctionLabel(outerTx.value.function as TxFunctionRaw)
      : '',
  );

  const isDex = computed((): boolean => isTxDex(innerTx.value, dexContracts.value));

  const isDexAllowance = computed((): boolean => (
    !!innerTx.value
    && isTxFunctionDexAllowance(innerTx.value?.function)
    && !!availableTokens.value[innerTx.value.contractId]
  ));

  const isDexAddLiquidity = computed(
    (): boolean => isTxFunctionDexAddLiquidity(innerTx.value?.function),
  );

  const isDexRemoveLiquidity = computed(
    (): boolean => isTxFunctionDexRemoveLiquidity(innerTx.value?.function),
  );

  const isDexPool = computed(
    (): boolean => isTxFunctionDexPool(innerTx.value?.function),
  );

  const isMultisig = computed((): boolean => (
    !!outerTx.value?.function
    && (
      includes(Object.values(TX_FUNCTIONS_MULTISIG), outerTx.value.function)
      || !!outerTx.value.payerId
    )
  ));

  const isTip = computed((): boolean => !!(
    innerTx.value?.contractId
    && innerTx.value?.function
    && includes(
      [tippingContractAddresses.value.tippingV1!, tippingContractAddresses.value.tippingV2!],
      innerTx.value.contractId,
    )
    && includes(
      [TX_FUNCTIONS.tip, TX_FUNCTIONS.retip, TX_FUNCTIONS.claim],
      innerTx.value.function,
    )
  ));

  const isErrorTransaction = computed(
    (): boolean => {
      const { returnType } = outerTx.value || {};
      return !!(returnType && returnType !== TX_RETURN_TYPE_OK);
    },
  );

  const txOwnerAddress = computed(() => getTxOwnerAddress(innerTx.value));

  const ownershipStatus = computed(() => getOwnershipStatus(
    activeAccount.value,
    accounts.value,
    innerTx.value,
  ));

  const direction = computed(
    (): ObjectValues<typeof TX_DIRECTION> => (innerTx.value?.function === TX_FUNCTIONS.claim)
      ? TX_DIRECTION.received
      : getTxDirection(
        outerTx.value?.payerId ? outerTx.value : innerTx.value,
        externalAddress
        || (
          ownershipStatus.value !== AE_TRANSACTION_OWNERSHIP_STATUS.current
          && txOwnerAddress.value
        )
        || activeAccount.value.address,
      ),
  );

  function setTransactionTx(newTx: ITx) {
    outerTx.value = newTx;
    innerTx.value = getInnerTransaction(newTx);
  }

  function setExternalAddress(address: Encoded.AccountAddress) {
    ownerAddress.value = address;
  }

  function getOwnershipAccount(externalOwnerAddress?: Encoded.AccountAddress): IAccountOverview {
    const { current, subAccount } = AE_TRANSACTION_OWNERSHIP_STATUS;
    switch (ownershipStatus.value) {
      case current:
        return activeAccount.value;
      case subAccount: {
        const { accountId, callerId } = innerTx.value || {};
        return accounts.value.find(({ address }) => [accountId, callerId].includes(address))!;
      }
      default: {
        const address = externalOwnerAddress || txOwnerAddress.value!;
        return { address };
      }
    }
  }

  return {
    hasNestedTx,
    outerTxTag,
    innerTxTag,
    innerTx: innerTx as any,
    txTypeLabel,
    txTypeListLabel,
    txFunctionLabel,
    isErrorTransaction,
    isDex,
    isDexAddLiquidity,
    isDexAllowance,
    isDexPool,
    isDexRemoveLiquidity,
    isMultisig,
    isTip,
    direction,
    getOwnershipAccount,
    setTransactionTx,
    setExternalAddress,
  };
}
