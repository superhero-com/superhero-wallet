<template>
  <span
    class="token-amount"
    :class="[{ large, small, vertical }]"
  >
    <span
      class="amount"
      :style="dynamicSizing
        ? { '--font-size': calculateFontSize(amountRounded) }
        : {}"
    >
      {{ amountRounded }}
      <span
        v-if="!hideSymbol"
        class="symbol"
        v-text="symbolComputed"
      />
    </span>

    <span
      v-if="amountFiat"
      class="fiat"
      v-text="amountFiat"
    />
  </span>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { Protocol } from '@/types';
import {
  calculateFontSize,
  formatNumber,
} from '@/utils';
import { useCurrencies } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default defineComponent({
  props: {
    amount: { type: Number, required: true },
    symbol: { type: String, default: null },
    protocol: { type: String as PropType<Protocol>, required: true },
    vertical: Boolean,
    hideFiat: Boolean,
    hideSymbol: Boolean,
    highPrecision: Boolean,
    dynamicSizing: Boolean,
    large: Boolean,
    small: Boolean,
  },
  setup(props) {
    const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);

    const { getFormattedAndRoundedFiat } = useCurrencies();

    const amountRounded = computed(() => {
      if (Number.isInteger(props.amount) || props.amount === 0) {
        return props.amount;
      }
      return formatNumber(
        props.amount,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: adapter.getAmountPrecision({
            amount: props.amount,
            highPrecision: props.highPrecision,
          }),
        },
      );
    });

    const amountFiat = computed(
      (): string => (props.hideFiat) ? '' : getFormattedAndRoundedFiat(props.amount, props.protocol),
    );

    const symbolComputed = computed(() => props.symbol || adapter.coinSymbol);

    return {
      amountRounded,
      amountFiat,
      symbolComputed,
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

  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: variables.$color-white;

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

    color: rgba(variables.$color-white, 0.75);
    white-space: nowrap;
  }

  &.vertical {
    flex-direction: column;
    align-items: normal;
    gap: 4px;
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
