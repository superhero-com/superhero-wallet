<template>
  <span
    class="token-amount"
    :class="[direction, { large }]"
  >
    {{ amountRounded }}
    <span
      v-if="!noSymbol"
      class="symbol"
    >
      {{ symbol }}
    </span>
    <span
      v-if="amountFiat"
      class="fiat"
      :class="{ 'fiat-below': fiatBelow }"
    >
      {{ amountFiat }}
    </span>
  </span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'AE' },
    aex9: { type: Boolean, default: false },
    fiatBelow: { type: Boolean, default: false },
    hideFiat: { type: Boolean },
    direction: {
      type: String,
      validator: (value) => ['sent', 'received'].includes(value),
      default: undefined,
    },
    large: { type: Boolean },
    noSymbol: { type: Boolean },
    highPrecision: { type: Boolean },
  },
  computed: {
    amountRounded() {
      if (Number.isInteger(this.amount)) return this.amount;
      if (this.amount === 0) return this.amount;
      return this.amount.toFixed((this.highPrecision || this.amount < 0.01) ? 9 : 2);
    },
    ...mapState({
      amountFiat(state, { convertToCurrency, formatCurrency }) {
        if (this.hideFiat || this.aex9) return '';
        const converted = convertToCurrency(this.amount);
        if (this.amount === 0) return this.addBraces(formatCurrency(0));
        if (converted < 0.01) return this.addBraces(`<${formatCurrency(0.01)}`);
        return this.addBraces(`≈${formatCurrency(converted)}`);
      },
    }),
  },
  methods: {
    addBraces(result) {
      if (this.$route.meta.newUI) {
        return result;
      }
      return `(${result})`;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.new-ui {
  .token-amount {
    .symbol {
      color: variables.$color-light-grey;
    }

    .fiat {
      margin-left: 8px;
    }
  }
}

.token-amount {
  @extend %face-sans-14-regular;

  color: variables.$color-white;

  .symbol {
    @extend %face-sans-14-medium;

    color: variables.$color-blue;
  }

  .fiat {
    color: variables.$color-dark-grey;

    &.fiat-below {
      display: block;
    }
  }

  &.sent {
    color: variables.$color-error;

    &::before {
      font-weight: 600;
      content: '−';
    }
  }

  &.received {
    color: variables.$color-green-hover;

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
