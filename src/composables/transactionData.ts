import { computed, Ref } from 'vue';
import { Tag } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import type {
  AccountAddress,
  BigNumberPublic,
  ITokenResolved,
  ITransaction,
  ObjectValues,
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
  AE_COIN_PRECISION,
  AE_TRANSACTION_OWNERSHIP_STATUS,
  TX_FUNCTIONS,
  TX_FUNCTIONS_MULTISIG,
  TX_FUNCTIONS_TYPE_DEX,
  TX_RETURN_TYPE_OK,
} from '@/protocols/aeternity/config';
import {
  aettosToAe,
  categorizeContractCallTxObject,
  getInnerTransaction,
  getOwnershipStatus,
  getTransactionTokenInfoResolver,
  getTxDirection,
  getTxFunctionParsed,
  getTxFunctionRaw,
  getTxOwnerAddress,
  getTxTag,
  isTransactionAex9,
  isTxDex,
} from '@/protocols/aeternity/helpers';
import { useFungibleTokens } from '@/composables/fungibleTokens';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';

import { useTippingContracts } from './tippingContracts';

interface UseTransactionOptions {
  transaction: Ref<ITransaction | undefined>;
  transactionCustomOwner?: Ref<AccountAddress | undefined>;
  showDetailedAllowanceInfo?: boolean;
}

/**
 * Provide detailed information for the provided transaction based on other app states.
 */
export function useTransactionData({
  transaction,
  transactionCustomOwner,
  showDetailedAllowanceInfo = false,
}: UseTransactionOptions) {
  const { dexContracts } = useAeSdk();
  const { accounts, activeAccount } = useAccounts();
  const { tippingContractAddresses } = useTippingContracts();
  const { getProtocolAvailableTokens, getTxAssetSymbol } = useFungibleTokens();

  const protocol = computed(() => transaction.value?.protocol || PROTOCOLS.aeternity);
  const outerTx = computed(() => transaction.value?.tx);
  const innerTx = computed(() => outerTx.value ? getInnerTransaction(outerTx.value) : undefined);
  const outerTxTag = computed(() => getTxTag(outerTx.value));
  const innerTxTag = computed(() => getTxTag(innerTx.value));
  const txType = computed(() => outerTxTag.value ? Tag[outerTxTag.value] as TxType : null);
  const txFunctionParsed = computed(() => getTxFunctionParsed(innerTx.value?.function));
  const txFunctionRaw = computed(() => getTxFunctionRaw(innerTx.value?.function));

  const fee = computed((): number => outerTx.value?.fee || 0);
  const transactionDefaultOwner = computed(() => getTxOwnerAddress(innerTx.value));
  const transactionOwner = computed(() => (
    transactionCustomOwner?.value
    || transaction.value?.transactionOwner
    || activeAccount.value.address
  ));
  const protocolTokens = computed(() => getProtocolAvailableTokens(protocol.value));

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
    (): string => (txFunctionRaw.value)
      ? getTxFunctionLabel(txFunctionRaw.value)
      : '',
  );

  const isTransactionCoin = computed(
    (): boolean => outerTx.value?.contractId ? isAssetCoin(outerTx.value.contractId) : true,
  );

  const isDex = computed((): boolean => (
    (protocol.value === PROTOCOLS.aeternity && isTxDex(innerTx.value, dexContracts.value))
    || (
      protocol.value === PROTOCOLS.ethereum
      && !!outerTx.value?.recipientId
      && !!protocolTokens.value[outerTx.value.recipientId]
    )
  ));

  const isDexAllowance = computed((): boolean => (
    !!innerTx.value
    && includes(TX_FUNCTIONS_TYPE_DEX.allowance, txFunctionRaw.value)
    && !!getProtocolAvailableTokens(PROTOCOLS.aeternity)[innerTx.value.contractId]
  ));

  const isDexLiquidityAdd = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.addLiquidity, txFunctionRaw.value),
  );
  const isDexLiquidityRemove = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.removeLiquidity, txFunctionRaw.value),
  );
  const isDexPool = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.pool, txFunctionRaw.value),
  );
  const isDexSwap = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.swap, txFunctionRaw.value),
  );
  const isDexMaxSpent = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.maxSpent, txFunctionRaw.value),
  );
  const isDexMinReceived = computed(
    (): boolean => includes(TX_FUNCTIONS_TYPE_DEX.minReceived, txFunctionRaw.value),
  );

  const isMultisig = computed((): boolean => (
    !!outerTx.value?.function
    && (
      includes(Object.values(TX_FUNCTIONS_MULTISIG), outerTx.value.function)
      || !!outerTx.value.payerId
    )
  ));

  const isAex9 = computed(
    () => transaction.value && isTransactionAex9(transaction.value),
  );

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
        transactionOwner.value,
      ),
  );

  function getAeTxTotalAmount(isReceived: boolean = false): number {
    if (isDexAllowance.value) {
      return toShiftedBigNumber(fee.value, -AE_COIN_PRECISION).toNumber();
    }

    const contractCallData = transaction.value?.tx
      && categorizeContractCallTxObject(transaction.value);

    const tokenData = contractCallData
      && getProtocolAvailableTokens(PROTOCOLS.aeternity)[contractCallData.assetContractId!];

    if (contractCallData && tokenData) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -(tokenData.decimals || AE_COIN_PRECISION), // TODO possibility of wrong precision
      );
    }

    const claimTipAmount = (outerTx.value?.function === 'claim') ? outerTx.value?.log?.[0]?.topics[2] : null;
    const rawAmount = innerTx.value.amount || innerTx.value?.nameFee || claimTipAmount || 0;
    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));
    const gasCost = (outerTx.value?.gasPrice && outerTx.value?.gasUsed)
      ? new BigNumber(outerTx.value.gasPrice).multipliedBy(outerTx.value.gasUsed)
      : 0;

    return +aettosToAe(
      amount
        .plus(isReceived ? 0 : outerTx.value?.fee || 0)
        .plus(isReceived ? 0 : innerTx.value?.fee || 0)
        .plus(isReceived ? 0 : gasCost),
    );
  }

  function getCommonTxTotalAmount(isReceived: boolean = false): number {
    return new BigNumber(outerTx.value?.amount || 0)
      .plus(isReceived ? 0 : fee.value)
      .toNumber();
  }

  const amount = computed((): number => (protocol.value === PROTOCOLS.aeternity)
    ? getAeTxTotalAmount()
    : getCommonTxTotalAmount());

  const amountTotal = computed((): number => {
    const isReceived = direction.value === TX_DIRECTION.received;
    return (protocol.value === PROTOCOLS.aeternity)
      ? getAeTxTotalAmount(isReceived)
      : getCommonTxTotalAmount(isReceived);
  });

  /**
   * List of assets used within the transaction.
   * Contains more than one item if the transaction is for example a swapping event.
   */
  const transactionAssets = computed((): ITokenResolved[] => {
    if (!transaction.value?.tx) {
      return [];
    }

    let convertToCoin = false;

    const adapter = ProtocolAdapterFactory.getAdapter(protocol.value);

    // TODO move AE specific logic to adapter and store resolved data in the transactions
    if (protocol.value === PROTOCOLS.aeternity) {
      // AE DEX and wrapped AE (WAE)
      if (
        isDex.value
        && txFunctionParsed.value
        && (!isDexAllowance.value || showDetailedAllowanceInfo)
      ) {
        const functionResolver = getTransactionTokenInfoResolver(txFunctionParsed.value);
        if (functionResolver) {
          return functionResolver(transaction.value, protocolTokens.value)
            .tokens
            .map(({
              amount: txAmount,
              decimals,
              ...otherAssetData
            }) => ({
              amount: +toShiftedBigNumber(txAmount!, -decimals!),
              ...otherAssetData,
            }));
        }
      }

      // Convert all unresolved transaction with non-token contractId to coin.
      // For example contract calls
      if (
        !protocolTokens.value[innerTx.value?.contractId]
        || innerTxTag.value === Tag.ContractCreateTx
      ) {
        convertToCoin = true;
      }
    }
    const isReceived = direction.value === TX_DIRECTION.received;
    const coinAssetData: ITokenResolved = {
      ...innerTx.value || {},
      amount: amount.value,
      assetType: ASSET_TYPES.coin,
      contractId: adapter.coinContractId,
      isReceived,
      name: adapter.coinName,
      protocol,
      symbol: adapter.coinSymbol,
    };

    // When approving transaction created by ETH dapp connected to wallet
    if (protocol.value === PROTOCOLS.ethereum && isDex.value) {
      const tokenAssetData = {
        ...protocolTokens.value[outerTx.value?.recipientId!] || {},
        assetType: ASSET_TYPES.token,
        isReceived: true,
      };
      if (outerTx.value?.contractId === adapter.coinContractId) {
        return [coinAssetData, tokenAssetData];
      }
      return [tokenAssetData, coinAssetData];
    }
    if (isTransactionCoin.value || isDexAllowance.value || isMultisig.value || convertToCoin) {
      return [coinAssetData];
    }

    const token = protocolTokens.value[outerTx.value!.contractId];

    return [{
      ...innerTx.value || {},
      ...token || {},
      amount: amount.value,
      assetType: ASSET_TYPES.token,
      contractId: outerTx.value?.contractId,
      isReceived,
      protocol,
      symbol: getTxAssetSymbol(transaction.value),
    }];
  });

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
        return externalOwnerAddress || transactionDefaultOwner.value!;
      }
    }
  }

  return {
    amountTotal,
    amount,
    fee,
    outerTxTag,
    innerTxTag,
    innerTx,
    txFunctionLabel,
    txFunctionParsed,
    txFunctionRaw,
    txTypeLabel,
    txTypeListLabel,
    isAex9,
    isErrorTransaction,
    isDex,
    isDexAllowance,
    isDexLiquidityAdd,
    isDexLiquidityRemove,
    isDexMaxSpent,
    isDexMinReceived,
    isDexPool,
    isDexSwap,
    isMultisig,
    isTip,
    isTransactionCoin,
    direction,
    transactionAssets,
    getOwnershipAddress,
  };
}
