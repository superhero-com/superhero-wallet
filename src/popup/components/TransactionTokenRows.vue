<template>
  <div
    v-if="filteredTokens.length"
    class="transaction-token-rows"
  >
    <div
      v-for="token in filteredTokens"
      :key="token.symbol"
      class="token-row"
      :class="{
        error,
        received: token.isReceived
      }"
      :style="{ '--font-size': calculateFontSize(tokenAmount(token)) }"
    >
      <Tokens
        :tokens="token.isPool ? filteredTokens : [token]"
        :icon-size="iconSize"
        full-ae-symbol
      />
      <span class="amount">
        {{ token.isReceived ? '' : '−' }}
        {{ amountRounded(tokenAmount(token)) }}
        <span class="token-name">
          {{ truncateString(getTokenName(token), 5) }}
        </span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import type { ITokenResolved, ITransaction } from '@/types';
import {
  amountRounded,
  calculateFontSize,
  toShiftedBigNumber,
  truncateString,
} from '@/utils';
import {
  TX_DIRECTION,
} from '@/popup/utils';
import { useTransactionTokens } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';

import Tokens from './Tokens.vue';

export default defineComponent({
  name: 'TransactionTokenRows',
  components: { Tokens },
  props: {
    transaction: { type: Object as PropType<ITransaction | undefined>, default: null },
    extTokens: { type: Array as PropType<ITokenResolved[] | undefined>, default: null },
    iconSize: { type: String, default: 'rg' },
    direction: { type: String, default: '' },
    error: Boolean,
    isAllowance: Boolean,
  },
  setup(props) {
    const store = useStore();
    const localTokens = ref();

    if (!props.extTokens && !!props.transaction) {
      const { tokens } = useTransactionTokens({
        store,
        transaction: props.transaction,
        direction: props.direction,
        isAllowance: props.isAllowance,
        showDetailedAllowanceInfo: true,
      });

      localTokens.value = tokens.value;
    }

    const filteredTokens = computed<ITokenResolved[]>(
      () => (props.extTokens || localTokens.value)?.filter(
        ({ amount }: Partial<ITokenResolved>) => amount !== undefined,
      ) || [],
    );

    function tokenAmount(token: ITokenResolved) {
      return token.decimals
        ? toShiftedBigNumber(token.amount || 0, -token.decimals)
        : token.amount;
    }

    const getTokenName = (token: ITokenResolved) => token?.isAe ? AE_SYMBOL : token.symbol;

    return {
      filteredTokens,
      tokenAmount,
      truncateString,
      getTokenName,
      amountRounded,
      calculateFontSize,
      TX_DIRECTION,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-token-rows {
  @extend %face-sans-15-regular;

  width: 100%;
  line-height: 20px;

  .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: var(--font-size);

    .amount {
      color: variables.$color-white;
      font-weight: 500;
      white-space: nowrap;
    }

    &.received .amount {
      color: variables.$color-success-dark;
    }

    .tokens {
      color: variables.$color-white;
    }

    .token-name {
      @extend %face-sans-16-regular;

      letter-spacing: -2%;
    }
  }
}
</style>
