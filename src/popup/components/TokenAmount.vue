<template>
  <span
    class="token-amount"
    :class="[{ large, 'has-label': !!label, small }]"
  >
    <span>
      <span
        v-if="label"
        class="label"
      >
        {{ label }}
      </span>

      <span
        class="amount"
        :style="dynamicSizing
          ? { '--font-size': calculateFontSize(amountRounded) }
          : {}"
      >
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

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useCurrencies } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import { calculateFontSize } from '@/popup/utils';

export default defineComponent({
  props: {
    amount: { type: Number, required: true },
    label: { type: String, default: null },
    symbol: { type: String, default: AE_SYMBOL },
    aex9: { type: Boolean, default: false },
    fiatBelow: { type: Boolean, default: false },
    hideFiat: Boolean,
    large: Boolean,
    row: Boolean,
    noSymbol: Boolean,
    highPrecision: Boolean,
    dynamicSizing: Boolean,
    small: Boolean,
  },
  setup(props) {
    const { getFormattedAndRoundedFiat } = useCurrencies();

    const amountRounded = computed(() => {
      if (Number.isInteger(props.amount) || props.amount === 0) {
        return props.amount;
      }
      return props.amount.toFixed((props.highPrecision || props.amount < 0.01) ? 9 : 2);
    });

    const amountFiat = computed(
      (): string => (props.hideFiat || props.aex9) ? '' : getFormattedAndRoundedFiat(props.amount),
    );

    return {
      amountRounded,
      amountFiat,
      calculateFontSize,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.token-amount {
  @extend %face-sans-15-medium;

  color: variables.$color-white;

  .label {
    @extend %face-sans-14-medium;

    color: rgba(variables.$color-white, 0.5);
    display: block;
  }

  .amount {
    font-size: var(--font-size);
    line-height: 20px;
    white-space: nowrap;
  }

  .symbol {
    color: rgba(variables.$color-white, 0.75);
  }

  .fiat {
    @extend %face-sans-15-regular;

    margin-left: 8px;
    color: rgba(variables.$color-white, 0.75);

    &.fiat-below {
      display: block;
      margin-left: 0;
      padding-top: 4px;
      white-space: nowrap;
    }
  }

  &.has-label {
    display: inline-flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  &.large {
    @extend %face-sans-20-regular;

    .symbol {
      font: inherit;
    }

    .text {
      @extend %face-sans-16-regular;
    }

    .fiat {
      @extend %face-sans-18-regular;
    }
  }

  &.small {
    .fiat {
      @extend %face-sans-12-regular;
    }
  }
}
</style>
