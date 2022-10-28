<template>
  <span
    class="token-amount"
    :class="[direction, { large, 'has-label': !!label }]"
  >
    <span>
      <span
        v-if="label"
        class="label"
      >
        {{ label }}
      </span>

      <span class="amount">
        {{ amountRounded }}
        <span
          v-if="!noSymbol"
          class="symbol"
        >
          {{ symbol }}
        </span>
      </span>
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
    label: { type: String, default: null },
    symbol: { type: String, default: 'AE' },
    aex9: { type: Boolean, default: false },
    fiatBelow: { type: Boolean, default: false },
    hideFiat: Boolean,
    direction: {
      type: String,
      validator: (value) => ['sent', 'received'].includes(value),
      default: undefined,
    },
    large: Boolean,
    row: Boolean,
    noSymbol: Boolean,
    highPrecision: Boolean,
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
        if (this.amount === 0) return formatCurrency(0);
        if (converted < 0.01) return `<${formatCurrency(0.01)}`;
        return `≈${formatCurrency(converted)}`;
      },
    }),
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.token-amount {
  @extend %face-sans-14-regular;

  color: variables.$color-white;

  .label {
    @extend %face-sans-14-medium;

    color: rgba(variables.$color-white, 0.5);
    display: block;
  }

  .symbol {
    @extend %face-sans-14-medium;

    color: variables.$color-grey-light;
  }

  .fiat {
    margin-left: 8px;
    color: variables.$color-grey-dark;

    &.fiat-below {
      display: block;
      margin-left: 0;
    }
  }

  &.has-label {
    display: inline-flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  &.sent {
    color: variables.$color-danger;

    &::before {
      font-weight: 600;
      content: '−';
    }
  }

  &.received {
    color: variables.$color-success-hover;

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
