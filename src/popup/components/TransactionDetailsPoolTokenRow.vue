<template>
  <DetailsItem
    :label="label"
    class="pool-token-row"
  >
    <template #value>
      <div>
        <TokenAmount
          v-if="!hideAmount"
          :amount="amount"
          :protocol="PROTOCOLS.aeternity"
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
            :protocol="PROTOCOLS.aeternity"
          />
        </div>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import type { ITokenResolved } from '@/types';
import { convertWrappedCoinTokenToCoin, isAssetCoin, toShiftedBigNumber } from '@/utils';
import { PROTOCOLS } from '@/constants';

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
    tokens: { type: Array as PropType<ITokenResolved[]>, required: true },
    hideAmount: Boolean,
  },
  setup(props) {
    const amount = computed(() => +(
      props.token.decimals
        ? toShiftedBigNumber(props.token.amount!, -props.token.decimals)
        : props.token.amount!
    ));

    const assetsMapped = computed(
      () => (props.token.isPool ? props.tokens : [props.token])
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
@use '../../styles/typography';
@use '../../styles/variables';
@use '../../styles/mixins';

.pool-token-row {
  .contract-id {
    @extend %face-mono-12-medium;

    color: variables.$color-grey-light;
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

      color: variables.$color-white;
    }

    .separator {
      color: variables.$color-white;
    }
  }
}
</style>
