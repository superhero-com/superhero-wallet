<template>
  <div class="transaction-token-rows">
    <div
      v-for="token in tokens.filter(({ amount }) => amount != null)"
      :key="token.symbol"
      :class="['token-row', token.isReceived && 'received']"
      :style="{ '--font-size': calculateFontSize(tokenAmount(token)) }"
    >
      <Tokens
        :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]"
        :icon-size="iconSize"
        full-ae-symbol
      />
      <span class="amount">
        {{ token.isReceived ? '+' : '−' }}
        {{ tokenAmount(token) }}
      </span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { amountRounded, convertToken } from '../utils';
import Tokens from './Tokens.vue';

export default defineComponent({
  components: { Tokens },
  props: {
    tokens: { type: Array, required: true },
    iconSize: { type: String, default: 'rg' },
  },
  setup() {
    function tokenAmount(token) {
      return amountRounded(
        token.decimals
          ? convertToken(token.amount || 0, -token.decimals)
          : token.amount,
      );
    }

    function calculateFontSize(amount) {
      if (amount <= 999999) {
        return '18px';
      }
      if (amount <= 999999999) {
        return '16px';
      }
      if (amount <= 999999999999) {
        return '14px';
      }
      return '12px';
    }

    return {
      tokenAmount,
      calculateFontSize,
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
    @extend %face-sans-15-regular;

    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: var(--font-size);

    .amount {
      color: variables.$color-white;
    }

    &.received .amount {
      color: variables.$color-success-dark;
    }

    .tokens {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }
}
</style>
