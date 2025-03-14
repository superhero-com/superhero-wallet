<template>
  <ListItemWrapper
    v-if="asset"
    v-bind="$attrs"
    class="tokens-list-item"
    :to="preventNavigation ? null : {
      name: targetRouteName,
      params: {
        id: asset.contractId,
      },
    }"
    replace
    :extend="preventNavigation"
    :selected="selected"
  >
    <div class="row">
      <Tokens
        :tokens="[asset]"
        icon-size="lg"
        full-symbol
        bright
      />
      <TokenAmountFormatted
        :amount="asset.convertedBalance?.toString()"
        is-received
      />
    </div>
    <div
      v-if="!!asset.price"
      class="row bottom"
    >
      <div class="price">
        @ {{ priceFormatted }}
      </div>
      <div class="price">
        {{ balanceFormatted }}
      </div>
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { IAsset } from '@/types';
import { isAssetCoin } from '@/utils';
import { useCurrencies } from '@/composables';
import { ROUTE_COIN, ROUTE_MULTISIG_COIN, ROUTE_TOKEN } from '@/popup/router/routeNames';

import TokenAmountFormatted from '../TokenAmountFormatted.vue';
import Tokens from '../Tokens.vue';
import ListItemWrapper from '../ListItemWrapper.vue';

export default defineComponent({
  components: {
    TokenAmountFormatted,
    Tokens,
    ListItemWrapper,
  },
  props: {
    asset: { type: Object as PropType<IAsset>, default: null },
    preventNavigation: Boolean,
    selected: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const { getFormattedAndRoundedFiat } = useCurrencies();

    const isCoin = computed(() => isAssetCoin(props.asset.contractId));

    const priceFormatted = computed(() => getFormattedAndRoundedFiat(
      props.asset.price,
      props.asset.protocol,
    ));
    const balanceFormatted = computed(
      () => getFormattedAndRoundedFiat(
        (props.asset.convertedBalance || 0) * props.asset.price,
        props.asset.protocol,
      ),
    );

    const targetRouteName = computed(() => {
      if (props.isMultisig) {
        return ROUTE_MULTISIG_COIN;
      }
      if (isCoin.value) {
        return ROUTE_COIN;
      }
      return ROUTE_TOKEN;
    });

    return {
      isCoin,
      priceFormatted,
      targetRouteName,
      balanceFormatted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.tokens-list-item {
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.bottom {
      margin-top: 4px;
    }
  }

  .price {
    @extend %face-sans-12-regular;

    color: rgba($color-white, 0.75);
    letter-spacing: -0.02em;
  }
}
</style>
