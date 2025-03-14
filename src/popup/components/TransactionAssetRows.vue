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
    >
      <Tokens
        :tokens="asset.isPool ? filteredAssets : [asset]"
        :icon-size="iconSize"
        :protocol="protocol"
        full-symbol
        bright
      />
      <TokenAmountFormatted
        :amount="asset.amount?.toString()"
        :symbol="asset.symbol"
        :is-received="asset.isReceived"
        class="token-amount-formatted"
      />
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
import { calculateFontSize, convertWrappedCoinTokenToCoin } from '@/utils';

import { AllowedAssetIconSize } from './AssetIcon.vue';
import Tokens from './Tokens.vue';
import TokenAmountFormatted from './TokenAmountFormatted.vue';

export default defineComponent({
  name: 'TransactionAssetRows',
  components: {
    Tokens,
    TokenAmountFormatted,
  },
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

    return {
      TX_DIRECTION,
      filteredAssets,
      calculateFontSize,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.transaction-asset-rows {
  @extend %face-sans-15-regular;

  width: 100%;
  line-height: 20px;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 18px;

    &.received .token-amount-formatted {
      color: $color-success-dark;
    }

    &.multiple-rows {
      margin-bottom: 12px;
      padding-inline: 16px;

      .token-amount-formatted {
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
