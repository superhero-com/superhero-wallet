import { computed, ref } from 'vue';
import { Tag } from '@aeternity/aepp-sdk';
import { camelCase } from 'lodash-es';
import type {
  AccountAddress,
  ITokenResolved,
  ITransaction,
  ObjectValues,
  TxFunctionParsed,
  TxFunctionRaw,
  TxType,
} from '@/types';
import {
  includes,
  getTxFunctionLabel,
  getTxTypeLabel,
  getTxTypeListLabel,
  toShiftedBigNumber,
  isAssetCoin,
} from '@/utils';
import { ASSET_TYPES, PROTOCOLS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
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
  isTxDex,
  isTxFunctionDexAddLiquidity,
  isTxFunctionDexAllowance,
  isTxFunctionDexRemoveLiquidity,
  isTxFunctionDexPool,
  getTransactionTokenInfoResolver,
} from '@/protocols/aeternity/helpers';
import { useFungibleTokens } from '@/composables/fungibleTokens';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';

import { useTippingContracts } from './tippingContracts';

interface UseTransactionOptions {
  transaction?: ITransaction;
  externalAddress?: AccountAddress;
  showDetailedAllowanceInfo?: boolean;
}

/**
 * Provide detailed information for the provided transaction based on other app states.
 */
export function useTransactionData({
  transaction,
  externalAddress,
  showDetailedAllowanceInfo = false,
}: UseTransactionOptions = {}) {
  const { dexContracts } = useAeSdk();
  const { accounts, activeAccount } = useAccounts();
  const { tippingContractAddresses } = useTippingContracts();
  const { getProtocolAvailableTokens, getTxAmountTotal, getTxAssetSymbol } = useFungibleTokens();

  const activeTransaction = ref(transaction);
  const ownerAddress = ref<AccountAddress | undefined>(externalAddress);

  const outerTx = computed(() => activeTransaction.value?.tx);
  const innerTx = computed(() => outerTx.value ? getInnerTransaction(outerTx.value) : undefined);
  const outerTxTag = computed(() => outerTx.value ? getTxTag(outerTx.value) : null);
  const innerTxTag = computed(() => innerTx.value ? getTxTag(innerTx.value) : null);
  const txType = computed(() => outerTxTag.value ? Tag[outerTxTag.value] as TxType : null);

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

  const isTransactionCoin = computed(
    (): boolean => outerTx.value?.contractId ? isAssetCoin(outerTx.value.contractId) : true,
  );

  const isDex = computed((): boolean => isTxDex(innerTx.value, dexContracts.value));

  const isDexAllowance = computed((): boolean => (
    !!innerTx.value
    && isTxFunctionDexAllowance(innerTx.value?.function)
    && !!getProtocolAvailableTokens(PROTOCOLS.aeternity)[innerTx.value.contractId]
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

  /**
   * List of assets used within the transaction.
   * Contains more than one item if the transaction is for example a swapping event.
   */
  const transactionAssets = computed((): ITokenResolved[] => {
    if (!activeTransaction.value?.tx) {
      return [];
    }

    let convertToCoin = false;

    const { protocol = PROTOCOLS.aeternity } = activeTransaction.value;
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    const protocolTokens = getProtocolAvailableTokens(protocol);

    // TODO move AE specific logic to adapter and store resolved data in the transactions
    if (protocol === PROTOCOLS.aeternity) {
      // AE DEX and wrapped AE (WAE)
      if (
        innerTx.value?.function
        && (!isDexAllowance.value || showDetailedAllowanceInfo)
      ) {
        const functionName = camelCase(innerTx.value.function) as TxFunctionParsed;
        const functionResolver = getTransactionTokenInfoResolver(functionName);

        if (functionResolver) {
          return functionResolver({ tx: outerTx.value } as ITransaction, protocolTokens)
            .tokens
            .map(({
              amount,
              decimals,
              ...otherAssetData
            }) => ({
              amount: +toShiftedBigNumber(amount!, -decimals!),
              ...otherAssetData,
            }));
        }
      }

      // Convert all unresolved transaction with non-token contractId to coin.
      // For example contract calls
      if (!protocolTokens[innerTx.value?.contractId] || innerTxTag.value === Tag.ContractCreateTx) {
        convertToCoin = true;
      }
    }

    const amount = (isDexAllowance.value)
      ? toShiftedBigNumber(innerTx.value?.fee || 0, -adapter.coinPrecision)
      : getTxAmountTotal(activeTransaction.value, direction.value);
    const isReceived = direction.value === TX_DIRECTION.received;

    if (isTransactionCoin.value || isDexAllowance.value || isMultisig.value || convertToCoin) {
      return [{
        ...innerTx.value || {},
        amount,
        assetType: ASSET_TYPES.coin,
        contractId: adapter.coinContractId,
        isReceived,
        name: adapter.coinName,
        protocol,
        symbol: adapter.coinSymbol,
      }];
    }

    const token = protocolTokens[outerTx.value!.contractId];

    return [{
      ...innerTx.value || {},
      ...token || {},
      amount,
      assetType: ASSET_TYPES.token,
      contractId: outerTx.value?.contractId,
      isReceived,
      name: token?.name,
      protocol,
      symbol: getTxAssetSymbol(activeTransaction.value),
    }];
  });

  function setActiveTransaction(newTransaction: ITransaction) {
    activeTransaction.value = newTransaction;
  }

  function setExternalAddress(address: AccountAddress) {
    ownerAddress.value = address;
  }

  function getOwnershipAddress(externalOwnerAddress?: AccountAddress): AccountAddress {
    const { current, subAccount } = AE_TRANSACTION_OWNERSHIP_STATUS;
    switch (ownershipStatus.value) {
      case current:
        return activeAccount.value.address;
      case subAccount: {
        const { accountId, callerId } = innerTx.value || {};
        return accounts.value
          .find(({ address }) => [accountId, callerId].includes(address))?.address!;
      }
      default: {
        return externalOwnerAddress || txOwnerAddress.value!;
      }
    }
  }

  return {
    outerTxTag,
    innerTxTag,
    innerTx,
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
    isTransactionCoin,
    direction,
    transactionAssets,
    getOwnershipAddress,
    setActiveTransaction,
    setExternalAddress,
  };
}
