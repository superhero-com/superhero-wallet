<template>
  <div class="transaction-token-rows">
    <div
      v-for="token in tokens.filter(({ amount }) => amount != null)"
      :key="token.symbol"
      :class="[
        'token-row',
        token.isReceived ? TX_FUNCTIONS.received : TX_FUNCTIONS.sent,
        { error }
      ]"
    >
      <Tokens
        :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]"
        :icon-size="iconSize"
      />
      <span class="amount">
        {{ tokenAmount(token) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import {
  amountRounded,
  convertToken,
  TX_FUNCTIONS,
} from '../utils';
import { ITokenTransactionComposable } from '../../types';
import Tokens from './Tokens.vue';

export default defineComponent({
  components: { Tokens },
  props: {
    tokens: { type: Array, required: true },
    iconSize: { type: String, default: 'rg' },
    error: Boolean,
  },
  setup() {
    function tokenAmount(token: ITokenTransactionComposable) {
      const sign = token.isReceived ? '+' : '−';
      const amount = amountRounded(token.decimals
        ? convertToken(token.amount || 0, -token.decimals)
        : token.amount);
      return `${sign} ${amount}`;
    }
    return {
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
