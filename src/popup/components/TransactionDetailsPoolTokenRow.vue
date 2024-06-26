<template>
  <DetailsItem
    :label="label"
    class="pool-token-row"
  >
    <template #value>
      <div>
        <TokenAmount
          v-if="!hideAmount && amount"
          :amount="amount"
          :protocol="protocol"
          hide-fiat
          hide-symbol
        />
        <div class="token-info">
          <Tokens
            v-if="token"
            :tokens="assetsMapped"
          />
          <AddressTruncated
            v-if="token.contractId && !token.isWrappedCoin && !isAssetCoin(token.contractId)"
            show-explorer-link
            :address="token.contractId"
            :protocol="protocol"
          />
        </div>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import type { ITokenResolved, Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import { convertWrappedCoinTokenToCoin, isAssetCoin, toShiftedBigNumber } from '@/utils';

import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import Tokens from './Tokens.vue';
import AddressTruncated from './AddressTruncated.vue';

export default defineComponent({
  components: {
    AddressTruncated,
    TokenAmount,
    DetailsItem,
    Tokens,
  },
  props: {
    label: { type: String, default: '' },
    token: { type: Object as PropType<ITokenResolved>, required: true },
    // TODO having `token` and `tokens` prop is confusing, refactor to one `assets` prop
    tokens: { type: Array as PropType<ITokenResolved[]>, default: null },
    protocol: { type: String as PropType<Protocol>, default: PROTOCOLS.aeternity },
    hideAmount: Boolean,
  },
  setup(props) {
    const amount = computed(
      (): number => (
        props.token.decimals
        && props.token.amount
        && props.protocol !== PROTOCOLS.ethereum
      )
        ? toShiftedBigNumber(props.token.amount!, -props.token.decimals).toNumber()
        : +(props.token.amount || 0)!,
    );

    const assetsMapped = computed(
      () => ((props.token.isPool && props.tokens) ? props.tokens : [props.token])
        .map((asset) => convertWrappedCoinTokenToCoin(asset)),
    );

    return {
      isAssetCoin,
      PROTOCOLS,
      amount,
      assetsMapped,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.pool-token-row {
  .contract-id {
    @extend %face-mono-12-medium;

    color: $color-grey-light;
    letter-spacing: 0.07em;
    cursor: pointer;

    .icon {
      width: 22px;
      height: 22px;
    }
  }

  .token-info {
    @include mixins.flex(flex-start, center);

    gap: 8px;
    padding-top: 4px;

    .symbol:deep(),
    .address-shortening:deep() {
      font-weight: 500;
    }
  }

  .tokens:deep() {
    .symbol {
      @extend %face-sans-15-medium;

      color: $color-white;
    }

    .separator {
      color: $color-white;
    }
  }
}
</style>
