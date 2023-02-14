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
import { useGetter, useState } from '../../composables/vuex';
import {
  IAccount,
  INetwork,
  ITokenList,
  ITx,
  TxFunctionRaw,
} from '../../types';
import { i18n } from '../../store/plugins/languages';
import {
  AENS,
  DEX,
  FUNCTION_TYPE_DEX,
  includes,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
  getInnerTransaction,
  getTxType,
} from '../utils';

import TransactionTag from './TransactionTag.vue';

export default defineComponent({
  components: {
    TransactionTag,
  },
  props: {
    tx: { type: Object as PropType<ITx>, default: null },
    isIncomplete: Boolean,
    isPending: Boolean,
    isClaim: Boolean,
    dense: Boolean,
  },
  setup(props, { root }) {
    const lastNestedInnerTx = getInnerTransaction(props.tx);

    const {
      txType,
      isAllowance,
      isDex,
    } = useTransactionTx({ store: root.$store, tx: lastNestedInnerTx });

    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxDirection = useGetter('getTxDirection');
    const externalTxType = getTxType(props.tx);

    const labels = computed<(string | TranslateResult)[]>(() => {
      if (!props.tx) return [];
      const externalLabels = [];
      let innerLabels = [];

      if (externalTxType === TX_TYPE_MDW.GAMetaTx) {
        externalLabels.push(i18n.t('transaction.type.gaMetaTx'));
      }
      if (externalTxType === TX_TYPE_MDW.PayingForTx) {
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
          getTxDirection.value(lastNestedInnerTx) === TX_FUNCTIONS.received
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      } else if (isAllowance.value) {
        innerLabels = [i18n.t('transaction.dexType.allowToken')];
      } else if (isDex.value) {
        innerLabels = [
          DEX,
          FUNCTION_TYPE_DEX.pool.includes(lastNestedInnerTx.function as TxFunctionRaw)
            ? i18n.t('transaction.dexType.pool')
            : i18n.t('transaction.dexType.swap'),
        ];
      } else if (
        (
          lastNestedInnerTx.contractId
          && [tipContractV1, tipContractV2].includes(lastNestedInnerTx.contractId)
          && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], lastNestedInnerTx.function)
        ) || props.isClaim
      ) {
        innerLabels = [
          i18n.t('pages.token-details.tip'),
          props.isClaim
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      } else if (
        txType.value === TX_TYPE_MDW.GAAttachTx
        && externalTxType === TX_TYPE_MDW.PayingForTx
      ) {
        innerLabels = [
          i18n.t('transaction.type.createMultisigVault'),
        ];
      } else if (
        txType.value === SCHEMA.TX_TYPE.contractCall
        && availableTokens.value[lastNestedInnerTx.contractId]
        && (
          lastNestedInnerTx.function === TX_FUNCTIONS.transfer
          || props.isIncomplete
        )
      ) {
        innerLabels = [
          i18n.t('transaction.type.spendTx'),
          lastNestedInnerTx.callerId === account.value.address
            ? i18n.t('transaction.spendType.out')
            : i18n.t('transaction.spendType.in'),
        ];
      } else if (props.isPending) {
        return [];
      } else if (props.tx.function) {
        innerLabels = [
          transactionTypes[props.tx.function],
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
