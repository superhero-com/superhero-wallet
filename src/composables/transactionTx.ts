import { computed, ref } from 'vue';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import type {
  IAccountOverview,
  IDefaultComposableOptions,
  INetwork,
  ITokenList,
  ITx,
  ObjectValues,
  TxFunctionMultisig,
  TxFunctionRaw,
  TxType,
} from '../types';
import {
  TRANSACTION_OWNERSHIP_STATUS,
  TX_DIRECTION,
  TX_FUNCTION_TYPE_MULTISIG,
  TX_FUNCTIONS,
  TX_RETURN_TYPE_OK,
  getInnerTransaction,
  getOwnershipStatus,
  getTxTag,
  getTxOwnerAddress,
  includes,
  isContainingNestedTx,
  isTxDex,
  isTxFunctionDexAddLiquidity,
  isTxFunctionDexAllowance,
  isTxFunctionDexRemoveLiquidity,
  isTxFunctionDexPool,
} from '../popup/utils';
import { i18n } from '../store/plugins/languages';
import { useAccounts } from './accounts';
import { useSdk } from './sdk';

interface UseTransactionOptions extends IDefaultComposableOptions {
  tx?: ITx;
  externalAddress?: Encoded.AccountAddress;
}

type TxPropertyTranslations<T extends string | number | symbol = string> = Partial<
  Record<T, () => string>
>;

// @ts-ignore type coming from VueI18n is excessively deep and possibly infinite
const tg = i18n.global.t;

const txTypeTranslations: TxPropertyTranslations<TxType> = {
  ChannelCloseSoloTx: () => tg('transaction.type.channelCloseSoloTx'),
  ChannelSlashTx: () => tg('transaction.type.channelSlashTx'),
  ChannelSettleTx: () => tg('transaction.type.channelSettleTx'),
  ChannelSnapshotSoloTx: () => tg('transaction.type.channelSnapshotSoloTx'),
  ContractCreateTx: () => tg('transaction.type.contractCreateTx'),
  ContractCallTx: () => tg('transaction.type.contractCallTx'),
  GaMetaTx: () => tg('transaction.type.gaMetaTx'),
  GaAttachTx: () => tg('transaction.type.gaAttachTx'),
  NamePreclaimTx: () => tg('transaction.type.namePreClaimTx'),
  NameClaimTx: () => tg('transaction.type.nameClaimTx'),
  NameUpdateTx: () => tg('transaction.type.nameUpdateTx'),
  NameTransferTx: () => tg('transaction.type.nameTransferTx'),
  NameRevokeTx: () => tg('transaction.type.nameRevokeTx'),
  OracleRegisterTx: () => tg('transaction.type.oracleRegisterTx'),
  OracleExtendTx: () => tg('transaction.type.oracleExtendTx'),
  OracleQueryTx: () => tg('transaction.type.oraclePostQueryTx'),
  OracleResponseTx: () => tg('transaction.type.oracleRespondTx'),
  PayingForTx: () => tg('transaction.type.payingForTx'),
  SpendTx: () => tg('transaction.type.sentTx'),
};

/**
 * Replacements for the `txTypeTranslations` displayed on the transaction lists
 */
const txTypeListTranslations: TxPropertyTranslations<TxType> = {
  NamePreclaimTx: () => tg('transaction.listType.namePreClaimTx'),
  NameClaimTx: () => tg('transaction.listType.nameClaimTx'),
  NameUpdateTx: () => tg('transaction.listType.nameUpdateTx'),
  NameTransferTx: () => tg('transaction.listType.nameTransferTx'),
  NameRevokeTx: () => tg('transaction.listType.nameRevokeTx'),
  SpendTx: () => tg('transaction.listType.sentTx'),
};

const txFunctionTranslations: TxPropertyTranslations<TxFunctionRaw | TxFunctionMultisig> = {
  propose: () => tg('transaction.function.propose'),
  revoke: () => tg('transaction.function.revoke'),
  refuse: () => tg('transaction.function.refuse'),
  confirm: () => tg('transaction.function.confirm'),
  tip_token: () => tg('transaction.function.tip_token'),
  retip_token: () => tg('transaction.function.retip_token'),
};

export function useTransactionTx({
  store,
  tx,
  externalAddress,
}: UseTransactionOptions) {
  const { dexContracts } = useSdk({ store });
  const { accounts, activeAccount, activeAccountExtended } = useAccounts({ store });

  const outerTx = ref<ITx | undefined>(tx);
  const innerTx = ref<ITx | undefined>(tx ? getInnerTransaction(tx) : undefined);
  const ownerAddress = ref<Encoded.AccountAddress | undefined>(externalAddress);

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );

  const getTxDirection = computed(() => store.getters.getTxDirection);
  const getPreferredName = computed(() => store.getters['names/getPreferred']);

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
  const txTypeLabel = computed((): string => {
    const translateFunc = (txType.value) ? txTypeTranslations[txType.value] : null;
    return translateFunc ? translateFunc() : '';
  });

  /**
   * Transaction TX type value converted into human readable label
   * displayed on the transaction lists.
   */
  const txTypeListLabel = computed((): string => {
    const translateFunc = (txType.value)
      ? txTypeListTranslations[txType.value]
      : null;
    return translateFunc ? translateFunc() : txTypeLabel.value;
  });

  /**
   * Transaction TX function value converted into human readable label
   */
  const txFunctionLabel = computed((): string => {
    const translateFunc = (outerTx.value?.function)
      ? txFunctionTranslations[outerTx.value.function as TxFunctionRaw]
      : null;
    return translateFunc ? translateFunc() : '';
  });

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
      includes(Object.values(TX_FUNCTION_TYPE_MULTISIG), outerTx.value.function)
      || !!outerTx.value.payerId
    )
  ));

  const isTip = computed((): boolean => !!(
    innerTx.value?.contractId
    && innerTx.value?.function
    && includes(
      [activeNetwork.value.tipContractV1, activeNetwork.value.tipContractV2!],
      innerTx.value.contractId,
    )
    && includes(
      [TX_FUNCTIONS.tip, TX_FUNCTIONS.retip],
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
      : getTxDirection.value(
        outerTx.value?.payerId ? outerTx.value : innerTx.value,
        externalAddress
        || (
          ownershipStatus.value !== TRANSACTION_OWNERSHIP_STATUS.current
          && txOwnerAddress.value
        ),
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
    switch (ownershipStatus.value) {
      case TRANSACTION_OWNERSHIP_STATUS.current:
        return activeAccountExtended.value;
      case TRANSACTION_OWNERSHIP_STATUS.subAccount: {
        const { accountId, callerId } = innerTx.value || {};

        return accounts.value.find(({ address }) => [accountId, callerId].includes(address))!;
      }
      default: {
        const address = externalOwnerAddress || txOwnerAddress.value;

        return {
          name: getPreferredName.value(address) || '',
          address,
        };
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
