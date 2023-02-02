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
    const {
      txType,
      isAllowance,
      isDex,
    } = useTransactionTx({ store: root.$store, tx: props.tx });

    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxDirection = useGetter('getTxDirection');

    const labels = computed<(string | TranslateResult)[]>(() => {
      if (!props.tx) return [];

      const transactionTypes = i18n.t('transaction.type') as Record<string, TranslateResult>;
      const txTransactionType = transactionTypes[txType.value];
      const { tipContractV1, tipContractV2 } = activeNetwork.value;

      if (txType.value?.startsWith('name')) {
        return [AENS, txTransactionType];
      }
      if (txType.value === SCHEMA.TX_TYPE.gaMeta) {
        return [
          i18n.t('transaction.type.contractCallTx'),
          i18n.t('transaction.type.multisigProposal'),
        ];
      }
      if (txType.value === SCHEMA.TX_TYPE.spend) {
        return [
          i18n.t('transaction.type.spendTx'),
          getTxDirection.value(props.tx) === TX_FUNCTIONS.received
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      }
      if (isAllowance.value) {
        return [i18n.t('transaction.dexType.allowToken')];
      }
      if (isDex.value) {
        return [
          DEX,
          FUNCTION_TYPE_DEX.pool.includes(props.tx.function as TxFunctionRaw)
            ? i18n.t('transaction.dexType.pool')
            : i18n.t('transaction.dexType.swap'),
        ];
      }
      if (
        (
          props.tx.contractId
          && [tipContractV1, tipContractV2].includes(props.tx.contractId)
          && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], props.tx.function)
        ) || props.isClaim
      ) {
        return [
          i18n.t('pages.token-details.tip'),
          props.isClaim
            ? i18n.t('transaction.spendType.in')
            : i18n.t('transaction.spendType.out'),
        ];
      }
      if (
        txType.value === SCHEMA.TX_TYPE.contractCall
        && availableTokens.value[props.tx.contractId]
        && (
          props.tx.function === TX_FUNCTIONS.transfer
          || props.isIncomplete
        )
      ) {
        return [
          i18n.t('transaction.type.spendTx'),
          props.tx.callerId === account.value.address
            ? i18n.t('transaction.spendType.out')
            : i18n.t('transaction.spendType.in'),
        ];
      }
      if (txType.value === TX_TYPE_MDW.PayingForTx) {
        return [
          i18n.t('transaction.type.payingForTx'),
        ];
      }
      if (props.isPending) {
        return [];
      }
      return [txTransactionType];
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
