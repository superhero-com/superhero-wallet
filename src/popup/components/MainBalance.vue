<template>
  <div
    class="main-balance"
    :class="[assetFontSize]"
  >
    <span class="asset-symbol">{{ assetSymbol }}</span>
    <span class="asset-integer">{{ balanceParts.integer }}{{ balanceParts.decimal }}</span>
    <span class="asset-fractional">{{ balanceParts.fraction }}</span>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { Protocol } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { formatNumberParts } from '@/utils';

type AssetSize = 'lg' | 'md' | 'sm';

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
      }).reduce<{ integer: string; fraction: string; decimal: string }>((acc, current) => {
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

    const assetSymbol = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).coinSymbol,
    );

    const assetFontSize = computed((): AssetSize | null => {
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
      assetSymbol,
      balanceParts,
      assetFontSize,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/typography';
@use '../../styles/variables' as *;

.main-balance {
  --font-size-token: 30px;
  --font-size-symbol: 24px;

  display: flex;
  align-items: baseline;
  font-family: $font-sans;
  font-size: var(--font-size-symbol);

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

  .asset-symbol {
    font-weight: 500;
    color: $color-white;
    margin-right: 4px;
    text-transform: uppercase;
  }

  .asset-integer {
    font-size: var(--font-size-token);
    font-weight: 600;
    color: $color-white;
  }

  .asset-fractional {
    font-weight: 600;
    color: rgba($color-white, 0.75);
    opacity: 0.75;
  }

  .asset-symbol,
  .asset-integer,
  .asset-fractional {
    line-height: 32px;
  }
}
</style>
