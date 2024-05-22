<template>
  <div
    class="pool-tokens"
    :class="{ reversed }"
  >
    <TransactionDetailsPoolTokenRow
      v-for="(token, index) in tokens"
      :key="index"
      :token="token"
      :tokens="tokens"
      :hide-amount="hideAmount"
      :label="getLabel(token.isPool)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ITokenResolved, ITransaction } from '@/types';
import { useTransactionData } from '@/composables';
import { aettosToAe } from '@/protocols/aeternity/helpers';

import TransactionDetailsPoolTokenRow from './TransactionDetailsPoolTokenRow.vue';

export default defineComponent({
  components: {
    TransactionDetailsPoolTokenRow,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
    tokens: { type: Array as PropType<ITokenResolved[]>, required: true },
    hideAmount: Boolean,
    reversed: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const { isDexLiquidityAdd, isDexAllowance } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    function getLabel(isPool?: boolean): string {
      if (isDexAllowance.value) {
        return t('pages.transactionDetails.approveTokenUse');
      }
      if (isPool) {
        return isDexLiquidityAdd.value
          ? t('pages.transactionDetails.poolTokenReceived')
          : t('pages.transactionDetails.poolTokenSpent');
      }
      return isDexLiquidityAdd.value
        ? t('pages.transactionDetails.deposited')
        : t('pages.transactionDetails.withdrawn');
    }

    return {
      aettosToAe,
      getLabel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.pool-tokens {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 16px;

  &.reversed {
    flex-direction: column-reverse;
  }
}
</style>
