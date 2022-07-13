<template>
  <div
    class="transaction-token-row"
  >
    <TokenAmount
      :amount="tokenAmount || 0"
      :direction="direction"
      :class="{ 'with-error': hasError }"
      :aex9="token.isAex9"
      hide-fiat
      no-symbol
      :number-count="9"
      class="transaction-token-column"
    />
    <Tokens
      :tokens="token.tokens"
      class="transaction-token-column"
    />
  </div>
</template>

<script>
import { convertToken } from '../../utils/helper';
import { MAGNITUDE } from '../../utils/constants';
import TokenAmount from './TokenAmount.vue';
import Tokens from './Tokens.vue';

export default {
  components: { Tokens, TokenAmount },
  props: {
    token: {
      type: Object,
      required: true,
    },
    hasError: { type: Boolean },
    direction: {
      type: String,
      validator: (value) => ['sent', 'received'].includes(value),
      default: undefined,
    },
  },
  computed: {
    tokenAmount() {
      if (this.token.preventAmountConversion) return this.token.amount;
      return Math.abs(convertToken(this.token.amount, -(this.token.decimals || -MAGNITUDE)));
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.transaction-token-row {
  @extend %face-sans-18-regular;

  @include mixins.flex(center, center, row);

  margin-bottom: 12px;
  gap: 8px;
  width: 100%;

  .token-amount::v-deep {
    @extend %face-sans-18-regular;

    &.with-error {
      color: variables.$color-dark-grey;
    }
  }

  .tokens::v-deep {
    @extend %face-sans-18-medium;

    @include mixins.flex(flex-start, center, row);

    color: variables.$color-light-grey;

    .seperator {
      color: variables.$color-light-grey;
    }
  }
}

.transaction-token-column {
  flex: 1;
  max-width: calc(50% - 10px);

  &:first-child {
    width: 180px;
    text-align: end;
  }
}
</style>
