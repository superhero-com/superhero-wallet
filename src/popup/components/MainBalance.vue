<template>
  <div
    class="main-balance"
    :class="[tokenFontSize]"
  >
    <span class="token-symbol">{{ tokenSymbol }}</span>
    <span class="token-integer">{{ balanceParts.integer }}{{ balanceParts.decimal }}</span>
    <span class="token-fractional">{{ balanceParts.fraction }}</span>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { formatNumberParts } from '@/utils';
import { Protocol } from '../../types';

type TokenSize = 'lg' | 'md' | 'sm';

export default defineComponent({
  props: {
    balance: { type: Number, default: 0 },
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const balanceParts = computed(() => {
      const decimals = ProtocolAdapterFactory
        .getAdapter(props.protocol)
        .getAmountPrecision({ amount: props.balance });

      const { integer, fraction, decimal } = formatNumberParts(props.balance, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals,
      }).reduce<{ integer: string, fraction: string, decimal: string }>((acc, current) => {
        if (current.type === 'decimal') {
          return { ...acc, decimal: current.value };
        }
        if (current.type === 'fraction') {
          return { ...acc, fraction: current.value };
        }
        return { ...acc, integer: `${acc.integer || ''}${current.value}` };
      }, { integer: '', decimal: '0', fraction: ',' });

      return {
        integer,
        fraction,
        decimal,
      };
    });

    const tokenSymbol = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).getCoinSymbol(true),
    );

    const tokenFontSize = computed((): TokenSize | null => {
      const { fraction, integer } = balanceParts.value;
      const length = integer.length + fraction.length;
      if (length >= 16) {
        return 'sm';
      }
      if (length >= 14) {
        return 'md';
      }
      if (length >= 13) {
        return 'lg';
      }
      return null;
    });

    return {
      tokenSymbol,
      balanceParts,
      tokenFontSize,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/typography';
@use '../../styles/variables';

.main-balance {
  --font-size-token: 30px;
  --font-size-symbol: 24px;

  display: flex;
  align-items: baseline;

  .token-symbol {
    @extend %face-sans-24-semi-bold;

    font-size: var(--font-size-symbol);
    color: variables.$color-white;
    margin-right: 4px;
    text-transform: uppercase;
  }

  .token-integer {
    @extend %face-sans-30-semi-bold;

    font-size: var(--font-size-token);
    color: variables.$color-white;
  }

  .token-fractional {
    @extend %face-sans-24-semi-bold;

    font-size: var(--font-size-symbol);
    color: rgba(variables.$color-white, 0.75);
    opacity: 0.75;
  }

  &.lg {
    --font-size-token: 28px;
    --font-size-symbol: 22px;
  }

  &.md {
    --font-size-token: 26px;
    --font-size-symbol: 20px;
  }

  &.sm {
    --font-size-token: 22px;
    --font-size-symbol: 18px;
  }

  .token-symbol,
  .token-integer,
  .token-fractional {
    line-height: 32px;
  }
}
</style>
