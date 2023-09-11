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
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { useStore } from 'vuex';
import type { Protocol } from '@/types';
import {
  calculateFontSize,
  formatNumber,
} from '@/utils';
import { useCurrencies } from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import { PROTOCOL_AETERNITY } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

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
    // TODO - make required & remove default
    protocol: { type: String as PropType<Protocol>, default: PROTOCOL_AETERNITY },
  },
  setup(props) {
    const store = useStore();
    const { getFormattedAndRoundedFiat } = useCurrencies({ store });

    const amountRounded = computed(() => {
      if (Number.isInteger(props.amount) || props.amount === 0) {
        return props.amount;
      }
      return formatNumber(props.amount,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: ProtocolAdapterFactory
            .getAdapter(props.protocol)
            .getAmountPrecision({ amount: props.amount, highPrecision: props.highPrecision }),
        });
    });

    const amountFiat = computed(
      (): string => (props.hideFiat || props.aex9) ? '' : getFormattedAndRoundedFiat(props.amount, props.protocol),
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
