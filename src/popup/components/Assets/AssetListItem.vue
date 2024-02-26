<template>
  <ListItemWrapper
    v-if="tokenData"
    v-bind="$attrs"
    class="tokens-list-item"
    :to="preventNavigation ? null : {
      name: targetRouteName,
      params: {
        id: tokenData.contractId,
      },
    }"
    replace
    :extend="preventNavigation"
    :selected="selected"
  >
    <div class="row">
      <Tokens
        :tokens="[tokenData]"
        icon-size="lg"
        full-symbol
        bright
      />
      <TokenAmount
        :amount="+(tokenData.convertedBalance ?? 0)"
        :symbol="tokenData.symbol"
        :protocol="PROTOCOLS.aeternity"
        dynamic-sizing
        no-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="isAssetCoin"
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
import type { IToken } from '@/types';
import { PROTOCOLS } from '@/constants';
import { isCoin } from '@/utils';
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
    tokenData: { type: Object as PropType<IToken>, default: null },
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
    const price = computed(() => formatCurrency(getCurrentCurrencyRate(props.tokenData.protocol)));
    const balanceFormatted = computed(
      () => getFormattedFiat(props.tokenData.convertedBalance || 0, props.tokenData.protocol),
    );

    const isAssetCoin = computed(() => isCoin(props.tokenData.contractId));

    const targetRouteName = computed(() => {
      if (props.isMultisig) {
        return ROUTE_MULTISIG_COIN;
      }
      if (isAssetCoin.value) {
        return ROUTE_COIN;
      }
      return ROUTE_TOKEN;
    });

    return {
      PROTOCOLS,
      isAssetCoin,
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
