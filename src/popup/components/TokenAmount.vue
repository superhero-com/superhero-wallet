<template>
  <span
    ref="tokenAmountEl"
    class="token-amount"
    :class="[{
      large,
      small,
      vertical,
      'blink-hidden': isBlinking,
      blink: blinkOnChange,
    }]"
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
  ref,
  watch,
  onMounted,
} from 'vue';
import type { Protocol } from '@/types';
import { calculateFontSize, formatNumber } from '@/utils';
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
    blinkOnChange: Boolean,
  },
  setup(props) {
    const tokenAmountEl = ref<HTMLElement>();
    const amountRounded = ref<string | number>(0);
    const amountFiat = ref<string>('');
    const isBlinking = ref(false);

    const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);

    const { getFormattedAndRoundedFiat } = useCurrencies();

    const symbolComputed = computed(() => props.symbol || adapter.coinSymbol);

    function getAmountRounded() {
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
    }

    function getAmountFiat() {
      return (props.hideFiat) ? '' : getFormattedAndRoundedFiat(props.amount, props.protocol);
    }

    function updateAmountValues() {
      amountRounded.value = getAmountRounded();
      amountFiat.value = getAmountFiat();
    }

    watch(
      () => props.amount,
      () => {
        if (!props.blinkOnChange) {
          updateAmountValues();
        }
        isBlinking.value = true;
        setTimeout(() => {
          updateAmountValues();
          isBlinking.value = false;
        }, 500);
      },
    );

    onMounted(() => {
      updateAmountValues();
    });

    return {
      isBlinking,
      tokenAmountEl,
      amountRounded,
      amountFiat,
      symbolComputed,
      calculateFontSize,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.token-amount {
  @extend %face-sans-15-medium;

  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: $color-white;

  .amount {
    font-size: var(--font-size);
    line-height: 20px;
    white-space: nowrap;
  }

  .symbol {
    color: rgba($color-white, 0.75);
  }

  .fiat {
    @extend %face-sans-15-regular;

    color: rgba($color-white, 0.75);
    white-space: nowrap;
  }

  &.vertical {
    flex-direction: column;
    align-items: normal;
    gap: 4px;
  }

  &.large {
    @extend %face-sans-22-semi-bold;

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
