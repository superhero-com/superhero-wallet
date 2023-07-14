<template>
  <div
    class="transaction-tag-list"
    :class="{ dense }"
  >
    <TransactionTag
      v-for="label in labels"
      :key="label"
      :tx-type="label"
      class="title-tag"
      data-cy="label"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { Tag } from '@aeternity/aepp-sdk-13';
import { lowerFirst } from 'lodash-es';
import { useStore } from 'vuex';
import { useTransactionTx } from '../../composables';
import {
  INetwork,
  ITokenList,
  ITransaction,
  TxFunctionRaw,
} from '../../types';
import {
  AENS,
  DEX,
  TX_DIRECTION,
  FUNCTION_TYPE_DEX,
  includes,
  NAME_TAGS,
  TX_FUNCTIONS,
} from '../utils';

import TransactionTag from './TransactionTag.vue';

export default defineComponent({
  components: {
    TransactionTag,
  },
  props: {
    customTitle: { type: String, default: null },
    transaction: { type: Object as PropType<ITransaction>, default: null },
    dense: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { t, te } = useI18n();
    const {
      direction,
      innerTxType,
      innerTx,
      isAllowance,
      isDex,
      outerTxType,
    } = useTransactionTx({
      store,
      tx: props.transaction?.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
    const availableTokens = computed<ITokenList>(
      () => store.state.fungibleTokens.availableTokens,
    );

    const labels = computed<(string | TranslateResult)[]>(() => {
      if (props.customTitle) return [props.customTitle];
      if (!props.transaction?.tx) {
        return [];
      }

      const externalLabels = [];
      let innerLabels = [];

      if (outerTxType.value === Tag.GaMetaTx) {
        externalLabels.push(t('transaction.type.gaMetaTx'));
      }
      if (outerTxType.value === Tag.PayingForTx) {
        externalLabels.push(t('transaction.type.payingForTx'));
      }

      const txTransactionType = outerTxType.value ? t(`transaction.type.${lowerFirst(Tag[outerTxType.value])}`) : undefined;
      const { tipContractV1, tipContractV2 } = activeNetwork.value;

      if (!txTransactionType) {
        return [];
      }
      if (outerTxType.value === Tag.NameTransferTx) { // Unsupported type
        return [];
      }
      if (NAME_TAGS.has(outerTxType.value!)) {
        innerLabels = [AENS, txTransactionType];
      } else if (innerTxType.value === Tag.GaMetaTx) {
        innerLabels = [
          t('transaction.type.contractCallTx'),
          t('transaction.type.multisigProposal'),
        ];
      } else if (innerTxType.value === Tag.SpendTx) {
        innerLabels = [
          t('transaction.type.spendTx'),
          direction.value === TX_DIRECTION.received
            ? t('transaction.spendType.in')
            : t('transaction.spendType.out'),
        ];
      } else if (isAllowance.value) {
        innerLabels = [t('transaction.dexType.allowToken')];
      } else if (isDex.value) {
        innerLabels = [
          DEX,
          FUNCTION_TYPE_DEX.pool.includes(innerTx.value.function as TxFunctionRaw)
            ? t('transaction.dexType.pool')
            : t('common.swap'),
        ];
      } else if (
        (
          innerTx.value.contractId
          && [tipContractV1, tipContractV2].includes(innerTx.value.contractId)
          && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], innerTx.value.function)
        ) || props.transaction.claim
      ) {
        innerLabels = [
          t('pages.token-details.tip'),
          props.transaction.claim
            ? t('transaction.spendType.in')
            : t('transaction.spendType.out'),
        ];
      } else if (
        outerTxType.value === Tag.PayingForTx
        && innerTxType.value === Tag.GaAttachTx
      ) {
        innerLabels = [
          t('transaction.type.createMultisigVault'),
        ];
      } else if (
        outerTxType.value === Tag.ContractCallTx
        && availableTokens.value[innerTx.value.contractId]
        && (
          innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete
        )
      ) {
        innerLabels = [
          t('transaction.type.spendTx'),
          (
            innerTx.value.callerId === props.transaction.transactionOwner
            || !props.transaction.transactionOwner
          )
            ? t('transaction.spendType.out')
            : t('transaction.spendType.in'),
        ];
      } else if (props.transaction.pending) {
        return [];
      } else if (props.transaction.tx.function) {
        innerLabels = [
          te(`transaction.type.${props.transaction.tx.function}`) ? t(`transaction.type.${props.transaction.tx.function}`) : props.transaction.tx.function,
          txTransactionType,
        ];
      } else {
        innerLabels = [txTransactionType];
      }
      return [...externalLabels, ...innerLabels];
    });

    return {
      labels,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

.transaction-tag-list {
  @include mixins.flex(center, center);

  gap: 8px;
  margin-bottom: -8px;

  &.dense {
    gap: 4px;
    margin-bottom: 0;
  }
}
</style>
