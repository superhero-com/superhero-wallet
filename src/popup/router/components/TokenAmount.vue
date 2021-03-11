<template>
  <span class="token-amount" :class="[direction, { large }]">
    {{ amountRounded }}
    <span class="symbol">{{ symbol }}</span>
    <span v-if="text" class="text">{{ text }}</span>
  </span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'AE' },
    altText: { type: String },
    hideFiat: { type: Boolean },
    direction: {
      type: String,
      validator: (value) => ['sent', 'received'].includes(value),
    },
    large: { type: Boolean },
  },
  computed: {
    amountRounded() {
      return +this.amount.toFixed(this.amount < 0.01 ? 9 : 2);
    },
    ...mapState({
      amountFiat(state, { convertToCurrency, formatCurrency }) {
        if (this.symbol !== 'AE') return false;
        const converted = convertToCurrency(this.amount);
        if (converted < 0.01 || this.hideFiat) return false;
        return formatCurrency(converted);
      },
    }),
    text() {
      if (this.amountFiat) return `(≈${this.amountFiat})`;
      if (this.altText) return `(${this.altText})`;
      return false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.token-amount {
  @extend %face-sans-14-regular;

  color: $white-color;
  line-height: 24px;

  .symbol {
    @extend %face-sans-14-medium;

    color: $color-blue;
  }

  .text {
    color: $gray-2;
  }

  &.sent {
    color: $color-error;

    &::before {
      content: '-';
    }
  }

  &.received {
    color: $color-green-hover;

    &::before {
      content: '+';
    }
  }

  &.large {
    @extend %face-sans-20-regular;

    .symbol {
      font: inherit;
    }

    .text {
      @extend %face-sans-16-regular;
    }
  }
}
</style>
