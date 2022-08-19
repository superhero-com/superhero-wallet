<template>
  <div class="transaction-token-rows">
    <div
      v-for="token in tokens.filter(({ amount }) => amount != null)"
      :key="token.symbol"
      :class="['token-row', token.isReceived ? 'received': 'sent', { error }]"
    >
      <Tokens :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]" />
      <span class="amount">
        {{
          `${token.isReceived ? '+' : '−'}
          ${amountRounded(token.decimals
          ? convertToken(token.amount || 0, -token.decimals) : token.amount)}`
        }}
      </span>
    </div>
  </div>
</template>

<script>
import { amountRounded, convertToken } from '../../utils/helper';
import Tokens from './Tokens.vue';

export default {
  components: { Tokens },
  props: {
    tokens: { type: Array, required: true },
    error: { type: Boolean },
  },
  methods: {
    convertToken,
    amountRounded,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-token-rows {
  width: 100%;

  .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    @extend %face-sans-15-regular;

    &.error .amount {
      color: variables.$color-dark-grey;
    }

    &.received:not(.error) .amount {
      color: variables.$color-green-dark;
    }

    &.sent:not(.error) .amount {
      color: variables.$color-red-2;
    }

    .tokens {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }
}
</style>
