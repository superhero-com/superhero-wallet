<template>
  <div
    v-if="filteredAssets.length"
    class="transaction-asset-rows"
    :class="{ reversed: isReversed }"
  >
    <div
      v-for="asset in filteredAssets"
      :key="asset.symbol"
      class="row"
      :class="{
        error,
        received: asset.isReceived,
        'multiple-rows': multipleRows,
      }"
      :style="{ '--font-size': calculateFontSize(asset.amount!) }"
    >
      <Tokens
        :tokens="asset.isPool ? filteredAssets : [asset]"
        :icon-size="iconSize"
        :protocol="protocol"
        full-symbol
      />
      <span class="amount">
        {{ asset.isReceived ? '' : '&minus;' }}
        {{ amountFormatted({ token: asset, isRounded }) }}
        <span
          v-if="asset?.symbol"
          class="symbol"
          v-text="truncateString(asset.symbol, 5)"
        />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { ITokenResolved, Protocol } from '@/types';
import { TX_DIRECTION } from '@/constants';
import {
  amountRounded,
  calculateFontSize,
  convertWrappedCoinTokenToCoin,
  truncateString,
} from '@/utils';

import { AllowedAssetIconSize } from './AssetIcon.vue';
import Tokens from './Tokens.vue';

export default defineComponent({
  name: 'TransactionAssetRows',
  components: { Tokens },
  props: {
    assets: { type: Array as PropType<ITokenResolved[]>, default: null },
    iconSize: { type: String as PropType<AllowedAssetIconSize>, default: 'sm' },
    protocol: { type: String as PropType<Protocol>, required: true },
    error: Boolean,
    /** If the amount is already rounded */
    isRounded: Boolean,
    isReversed: Boolean,
    multipleRows: Boolean,
  },
  setup(props) {
    const filteredAssets = computed(
      (): ITokenResolved[] => (props.assets || [])
        ?.filter(({ amount }) => amount !== undefined)
        ?.map((asset) => convertWrappedCoinTokenToCoin(asset)),
    );

    const amountFormatted = ({ token, isRounded }: {token: ITokenResolved; isRounded: boolean}) => {
      // if amount is in scientific notation it is not rounded
      if (token.amount && (!isRounded || token.amount?.toString().indexOf('e') !== -1)) {
        return amountRounded(token.amount);
      }
      return token.amount;
    };

    return {
      TX_DIRECTION,
      filteredAssets,
      truncateString,
      amountFormatted,
      calculateFontSize,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-asset-rows {
  @extend %face-sans-15-regular;

  width: 100%;
  line-height: 20px;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: var(--font-size);

    .amount {
      color: variables.$color-white;
      font-weight: 500;
      white-space: nowrap;
    }

    &.received .amount {
      color: variables.$color-success-dark;
    }

    .symbol {
      @extend %face-sans-16-regular;

      letter-spacing: -2%;
    }

    &.multiple-rows {
      margin-bottom: 12px;
      padding-inline: 16px;

      .amount {
        @extend %face-sans-18-regular;
      }
    }
  }

  &.reversed {
    display: flex;
    flex-direction: column-reverse;
  }
}
</style>
