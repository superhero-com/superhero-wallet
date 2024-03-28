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
      <TokenAmount
        :amount="+(asset.convertedBalance ?? 0)"
        :protocol="PROTOCOLS.aeternity"
        dynamic-sizing
        hide-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="isCoin"
      class="row bottom"
    >
      <div class="price">
        @ {{ price }}
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
import { PROTOCOLS } from '@/constants';
import { isAssetCoin } from '@/utils';
import { useCurrencies } from '@/composables';
import { ROUTE_COIN, ROUTE_MULTISIG_COIN, ROUTE_TOKEN } from '@/popup/router/routeNames';

import TokenAmount from '../TokenAmount.vue';
import Tokens from '../Tokens.vue';
import ListItemWrapper from '../ListItemWrapper.vue';

export default defineComponent({
  components: {
    TokenAmount,
    Tokens,
    ListItemWrapper,
  },
  props: {
    asset: { type: Object as PropType<IAsset>, default: null },
    preventNavigation: Boolean,
    showCurrentPrice: Boolean,
    selected: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const {
      getCurrentCurrencyRate,
      getFormattedFiat,
      formatCurrency,
    } = useCurrencies();

    /**
     * price and balanceFormatted are applicable only for AE Coin
     */
    const price = computed(() => formatCurrency(getCurrentCurrencyRate(props.asset.protocol)));
    const balanceFormatted = computed(
      () => getFormattedFiat(props.asset.convertedBalance || 0, props.asset.protocol),
    );

    const isCoin = computed(() => isAssetCoin(props.asset.contractId));

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
      PROTOCOLS,
      isCoin,
      price,
      targetRouteName,
      balanceFormatted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

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

    color: rgba(variables.$color-white, 0.75);
    letter-spacing: -0.02em;
  }
}
</style>
