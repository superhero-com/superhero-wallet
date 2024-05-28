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
import { defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ITokenResolved, ITransaction, TxFunctionRaw } from '@/types';
import {
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_ALLOW_TOKEN,
} from '@/protocols/aeternity/config';
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

    function getLabel(isPool?: boolean): string {
      const tag = DEX_TRANSACTION_TAGS[props.transaction.tx.function as TxFunctionRaw];
      const provideLiquidity = tag === DEX_PROVIDE_LIQUIDITY;

      if (tag === DEX_ALLOW_TOKEN) {
        return t('pages.transactionDetails.approveTokenUse');
      }
      if (isPool) {
        return provideLiquidity
          ? t('pages.transactionDetails.poolTokenReceived')
          : t('pages.transactionDetails.poolTokenSpent');
      }
      return provideLiquidity
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
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.pool-tokens {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 16px;

  &.reversed {
    flex-direction: column-reverse;
  }
}
</style>
