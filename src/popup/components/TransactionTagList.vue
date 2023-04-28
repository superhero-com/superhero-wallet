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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { TranslateResult } from 'vue-i18n';
import { useTransactionTx } from '../../composables';
import {
  INetwork,
  ITokenList,
  ITransaction,
  TxFunctionRaw,
} from '../../types';
import { i18n } from '../../store/plugins/languages';
import {
  AENS,
  DEX,
  TX_DIRECTION,
  FUNCTION_TYPE_DEX,
  includes,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
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
  setup(props, { root }) {
    const {
      direction,
      txType,
      innerTx,
      isAllowance,
      isDex,
      outerTxType,
    } = useTransactionTx({
      store: root.$store,
      tx: props.transaction?.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    const activeNetwork = computed<INetwork>(() => root.$store.getters.activeNetwork);
    const availableTokens = computed<ITokenList>(
      () => root.$store.state.fungibleTokens.availableTokens,
    );

    const labels = computed<(string | TranslateResult)[]>(() => {
      if (props.customTitle) return [props.customTitle];
      if (!props.transaction?.tx) {
        return [];
      }

      const externalLabels = [];
      let innerLabels = [];

      if (outerTxType.value === TX_TYPE_MDW.GAMetaTx) {
        externalLabels.push(i18n.t('transaction.type.gaMetaTx'));
      }
      if (outerTxType.value === TX_TYPE_MDW.PayingForTx) {
        externalLabels.push(i18n.t('transaction.type.payingForTx'));
      }

      const transactionTypes = i18n.t('transaction.type') as Record<string, TranslateResult>;
      const txTransactionType = txType.value ? transactionTypes[txType.value] : undefined;
      const { tipContractV1, tipContractV2 } = activeNetwork.value;

      if (!txTransactionType) {
        return [];
      }
      if (txType.value?.startsWith('name')) {
        innerLabels = [AENS, txTransactionType];
      } else if (txType.value === SCHEMA.TX_TYPE.gaMeta) {
        innerLabels = [
          i18n.t('transaction.type.contractCallTx'),
          i18n.t('transaction.type.multisigProposal'),
        ];
      } else if (txType.value === SCHEMA.TX_TYPE.spend) {
        innerLabels = [
          i18n.t('transaction.type.spendTx'),
          direction.value === TX_DIRECTION.received
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      } else if (isAllowance.value) {
        innerLabels = [i18n.t('transaction.dexType.allowToken')];
      } else if (isDex.value) {
        innerLabels = [
          DEX,
          FUNCTION_TYPE_DEX.pool.includes(innerTx.value.function as TxFunctionRaw)
            ? i18n.t('transaction.dexType.pool')
            : i18n.t('transaction.dexType.swap'),
        ];
      } else if (
        (
          innerTx.value.contractId
          && [tipContractV1, tipContractV2].includes(innerTx.value.contractId)
          && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], innerTx.value.function)
        ) || props.transaction.claim
      ) {
        innerLabels = [
          i18n.t('pages.token-details.tip'),
          props.transaction.claim
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      } else if (
        txType.value === TX_TYPE_MDW.GAAttachTx
        && outerTxType.value === TX_TYPE_MDW.PayingForTx
      ) {
        innerLabels = [
          i18n.t('transaction.type.createMultisigVault'),
        ];
      } else if (
        txType.value === SCHEMA.TX_TYPE.contractCall
        && availableTokens.value[innerTx.value.contractId]
        && (
          innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete
        )
      ) {
        innerLabels = [
          i18n.t('transaction.type.spendTx'),
          (
            innerTx.value.callerId === props.transaction.transactionOwner
            || !props.transaction.transactionOwner
          )
            ? i18n.t('transaction.spendType.out')
            : i18n.t('transaction.spendType.in'),
        ];
      } else if (props.transaction.pending) {
        return [];
      } else if (props.transaction.tx.function) {
        innerLabels = [
          transactionTypes[props.transaction.tx.function] ?? props.transaction.tx.function,
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
