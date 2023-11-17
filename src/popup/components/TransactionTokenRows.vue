<template>
  <div
    v-if="filteredTokens.length"
    class="transaction-token-rows"
    :class="{ reversed }"
  >
    <div
      v-for="token in filteredTokens"
      :key="token.symbol"
      class="token-row"
      :class="{
        error,
        received: token.isReceived,
        'multiple-rows': multipleRows,
      }"
      :style="{ '--font-size': calculateFontSize(Number(token.amount)) }"
    >
      <Tokens
        :tokens="token.isPool ? filteredTokens : [token]"
        :icon-size="iconSize"
        :protocol="protocol"
        full-symbol
      />
      <span class="amount">
        {{ token.isReceived ? '' : '−' }}
        {{ isRounded ? token.amount : amountRounded(Number(token.amount)) }}
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
import type { ITokenResolved, ITransaction, Protocol } from '@/types';
import {
  amountRounded,
  calculateFontSize,
  truncateString,
} from '@/utils';
import { TX_DIRECTION } from '@/constants';
import { useTransactionTokens } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';

import Tokens, { AllowedTokenIconSize } from './Tokens.vue';

export default defineComponent({
  name: 'TransactionTokenRows',
  components: { Tokens },
  props: {
    transaction: { type: Object as PropType<ITransaction | undefined>, default: null },
    extTokens: { type: Array as PropType<ITokenResolved[] | undefined>, default: null },
    iconSize: { type: String as PropType<AllowedTokenIconSize>, default: 'rg' },
    direction: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
    error: Boolean,
    isAllowance: Boolean,
    isRounded: Boolean,
    reversed: Boolean,
    multipleRows: Boolean,
  },
  setup(props) {
    const localTokens = ref();

    if (!props.extTokens && !!props.transaction) {
      const { tokens } = useTransactionTokens({
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

    const getTokenName = (token: ITokenResolved) => token?.isAe ? AE_SYMBOL : token.symbol;

    return {
      filteredTokens,
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

    &.multiple-rows {
      margin-bottom: 12px;
      padding-inline: 16px;

      .amount {
        @extend %face-sans-18-regular;
      }

      .tokens {
        @extend %face-sans-18-medium;

        color: rgba(#fff, 0.75);
      }
    }
  }

  &.reversed {
    display: flex;
    flex-direction: column-reverse;
  }
}
</style>
