import { computed, ref } from 'vue';
import { Encoded, Tag } from '@aeternity/aepp-sdk';

import type {
  IAccountOverview,
  ITokenList,
  ITx,
  IDefaultComposableOptions,
  INetwork,
  ObjectValues,
  TxFunctionMultisig,
  TxFunctionRaw,
} from '../types';
import {
  TRANSACTION_OWNERSHIP_STATUS,
  TX_DIRECTION,
  TX_FUNCTION_TYPE_DEX,
  TX_FUNCTION_TYPE_MULTISIG,
  TX_FUNCTIONS,
  TX_RETURN_TYPE_OK,
  isContainingNestedTx,
  isTxDex,
  getInnerTransaction,
  getOwnershipStatus,
  getTxTag,
  getTxOwnerAddress,
  includes,
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

const txTypeTranslations: TxPropertyTranslations = {
  // @ts-ignore type coming from VueI18n is excessively deep and possibly infinite
  contractCreateTx: () => i18n.global.t('transaction.type.contractCreateTx'),
  contractCallTx: () => i18n.global.t('transaction.type.contractCallTx'),
  namePreClaimTx: () => i18n.global.t('transaction.type.namePreClaimTx'),
  nameClaimTx: () => i18n.global.t('transaction.type.nameClaimTx'),
  nameUpdateTx: () => i18n.global.t('transaction.type.nameUpdateTx'),
  nameTransferTx: () => i18n.global.t('transaction.type.nameTransferTx'),
  nameRevokeTx: () => i18n.global.t('transaction.type.nameRevokeTx'),
  oracleRegisterTx: () => i18n.global.t('transaction.type.oracleRegisterTx'),
  oracleExtendTx: () => i18n.global.t('transaction.type.oracleExtendTx'),
  oraclePostQueryTx: () => i18n.global.t('transaction.type.oraclePostQueryTx'),
  oracleRespondTx: () => i18n.global.t('transaction.type.oracleRespondTx'),
  channelCloseSoloTx: () => i18n.global.t('transaction.type.channelCloseSoloTx'),
  channelSlashTx: () => i18n.global.t('transaction.type.channelSlashTx'),
  channelSettleTx: () => i18n.global.t('transaction.type.channelSettleTx'),
  channelSnapshotSoloTx: () => i18n.global.t('transaction.type.channelSnapshotSoloTx'),
  payingForTx: () => i18n.global.t('transaction.type.payingForTx'),
  gaMetaTx: () => i18n.global.t('transaction.type.gaMetaTx'),
  gaAttachTx: () => i18n.global.t('transaction.type.gaAttachTx'),
  multisigProposal: () => i18n.global.t('transaction.type.multisigProposal'),
  sentTx: () => i18n.global.t('transaction.type.sentTx'),
  receivedTx: () => i18n.global.t('transaction.type.receivedTx'),
  multisigVaultCreated: () => i18n.global.t('transaction.type.multisigVaultCreated'),
  createMultisigVault: () => i18n.global.t('transaction.type.createMultisigVault'),
};

/**
 * Replacements for the `txTypeTranslations` displayed on the transaction lists
 */
const txTypeListTranslations: TxPropertyTranslations = {
  sentTx: () => i18n.global.t('transaction.listType.sentTx'),
  receivedTx: () => i18n.global.t('transaction.listType.receivedTx'),
  namePreClaimTx: () => i18n.global.t('transaction.listType.namePreClaimTx'),
  nameClaimTx: () => i18n.global.t('transaction.listType.nameClaimTx'),
  nameUpdateTx: () => i18n.global.t('transaction.listType.nameUpdateTx'),
  nameTransferTx: () => i18n.global.t('transaction.listType.nameTransferTx'),
  nameRevokeTx: () => i18n.global.t('transaction.listType.nameRevokeTx'),
  tipSent: () => i18n.global.t('transaction.listType.tipSent'),
  tipReceived: () => i18n.global.t('transaction.listType.tipReceived'),
};

const txFunctionTranslations: TxPropertyTranslations<TxFunctionRaw | TxFunctionMultisig> = {
  propose: () => i18n.global.t('transaction.function.propose'),
  revoke: () => i18n.global.t('transaction.function.revoke'),
  refuse: () => i18n.global.t('transaction.function.refuse'),
  confirm: () => i18n.global.t('transaction.function.confirm'),
  tip_token: () => i18n.global.t('transaction.function.tip_token'),
  retip_token: () => i18n.global.t('transaction.function.retip_token'),
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
  const innerTxTag = computed<Tag | null>(() => innerTx.value ? getTxTag(innerTx.value) : null);
  const outerTxTag = computed<Tag | null>(() => tx ? getTxTag(tx) : null);
  const txType = computed(() => outerTxTag.value ? Tag[outerTxTag.value] : null)

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
    !!innerTx.value?.function
    && includes(TX_FUNCTION_TYPE_DEX.allowance, innerTx.value.function)
    && !!availableTokens.value[innerTx.value.contractId]
  ));

  const isDexAddLiquidity = computed((): boolean => (
    !!innerTx.value
    && isDex.value
    && includes(TX_FUNCTION_TYPE_DEX.addLiquidity, innerTx.value.function)
  ));

  const isDexRemoveLiquidity = computed((): boolean => (
    !!innerTx.value
    && isDex.value
    && includes(TX_FUNCTION_TYPE_DEX.removeLiquidity, innerTx.value.function)
  ));

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
    isDexRemoveLiquidity,
    isMultisig,
    isTip,
    direction,
    getOwnershipAccount,
    setTransactionTx,
    setExternalAddress,
  };
}
