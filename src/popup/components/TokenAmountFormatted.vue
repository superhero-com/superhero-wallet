<template>
  <div class="token-amount-formatted">
    {{ isReceived ? '' : '&minus;' }}
    <div
      v-if="assetAmountFormatted.number"
      class="number"
      v-text="assetAmountFormatted.number"
    />
    <div
      v-if="assetAmountFormatted.zerosCount"
      class="zeros-count"
      v-text="assetAmountFormatted.zerosCount"
    />
    <div
      v-if="assetAmountFormatted.significantDigits"
      v-text="assetAmountFormatted.significantDigits"
    />
    <div
      v-if="symbol"
      class="symbol"
      v-text="truncateString(symbol, 5)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import BigNumber from 'bignumber.js';

import { amountRounded, formatNumber, truncateString } from '@/utils';

export default defineComponent({
  props: {
    amount: { type: String, default: undefined },
    symbol: { type: String, default: undefined },
    isReceived: Boolean,
  },
  setup(props) {
    const assetAmountFormatted = computed(() => {
      if (!props.amount) {
        return {
          number: '0',
        };
      }

      function formatLongNumber(number: string): string {
        return formatNumber(Number(number), { maximumFractionDigits: 2 });
      }
      const amount = new BigNumber(props.amount);

      if (amount.e && amount.c && amount.e < -3) {
        const zeros = amount.c[0].toString().match(/0+$/)?.[0].length;

        return {
          number: '0.0',
          zerosCount: -amount.e - 1,
          significantDigits: (
            zeros
              ? amount.c[0].toString().slice(0, -zeros)
              : amount.c[0].toString()
          )
            .slice(0, 8),
        };
      }

      if (amount.gt(1000000000000)) {
        return {
          number: `${formatLongNumber(amount.dividedBy(1000000000000).toFixed(2, 1))}T`,
        };
      }

      if (amount.gt(1000000000)) {
        return {
          number: `${formatLongNumber(amount.dividedBy(1000000000).toFixed(2, 1))}B`,
        };
      }

      if (amount.gt(1000000)) {
        return {
          number: `${formatLongNumber(amount.dividedBy(1000000).toFixed(2, 1))}M`,
        };
      }

      if (amount.gt(100000)) {
        return {
          number: `${formatLongNumber(amount.dividedBy(1000).toFixed(2, 1))}K`,
        };
      }

      if (amount.lt(1)) {
        return {
          number: amountRounded(props.amount),
        };
      }

      return {
        number: formatLongNumber(amountRounded(props.amount)),
      };
    });

    return {
      assetAmountFormatted,
      truncateString,
    };
  },
});

</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.token-amount-formatted {
  display: flex;
  align-items: center;
  color: $color-white;
  font-weight: 500;
  white-space: nowrap;

  .zeros-count {
    @extend %face-sans-16-medium;

    margin-top: 8px;
  }

  .symbol {
    @extend %text-body;

    letter-spacing: -2%;
    margin-left: 2px;
  }
}
</style>
