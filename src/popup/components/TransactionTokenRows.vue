<template>
  <div
    v-if="filteredTokens.length"
    class="transaction-token-rows"
  >
    <div
      v-for="token in filteredTokens"
      :key="token.symbol"
      :class="[
        'token-row',
        token.isReceived ? TX_FUNCTIONS.received : TX_FUNCTIONS.sent,
        { error }
      ]"
    >
      <Tokens
        :tokens="token.isPool ? [filteredTokens[0], filteredTokens[1]] : [token]"
        :icon-size="iconSize"
      />
      <span class="amount">
        {{ tokenAmount(token) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, PropType, ref,
} from '@vue/composition-api';
import {
  amountRounded,
  convertToken,
  TX_FUNCTIONS,
} from '../utils';
import { useTransactionTokens } from '../../composables';
import { ITokenResolved, ITransaction } from '../../types';

import Tokens from './Tokens.vue';

export default defineComponent({
  components: { Tokens },
  props: {
    transaction: { type: Object as PropType<ITransaction | undefined>, default: null },
    extTokens: { type: Array as PropType<ITokenResolved[] | undefined>, default: null },
    iconSize: { type: String, default: 'rg' },
    direction: { type: String, default: '' },
    error: Boolean,
    isAllowance: Boolean,
  },
  setup(props, { root }) {
    const localTokens = ref();

    if (!props.extTokens && !!props.transaction) {
      const { tokens } = useTransactionTokens({
        store: root.$store,
        transaction: props.transaction,
        direction: props.direction,
        isAllowance: props.isAllowance,
        showDetailedAllowanceInfo: true,
      });

      localTokens.value = tokens.value;
    }

    const filteredTokens = computed(() => (props.extTokens || localTokens.value)?.filter(
      ({ amount }: Partial<ITokenResolved>) => amount !== undefined,
    ) || []);

    function tokenAmount(token: ITokenResolved) {
      const sign = token.isReceived ? '+' : '-';
      const amount = amountRounded(token.decimals
        ? convertToken(token.amount || 0, -token.decimals)
        : token.amount);
      return `${sign} ${amount}`;
    }
    return {
      filteredTokens,
      tokenAmount,
      TX_FUNCTIONS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-token-rows {
  width: 100%;

  .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    @extend %face-sans-15-regular;

    &.error .amount {
      color: variables.$color-grey-dark;
    }

    &.received:not(.error) .amount {
      color: variables.$color-success-dark;
    }

    &.sent:not(.error) .amount {
      color: variables.$color-danger;
    }

    .tokens {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }
}
</style>
