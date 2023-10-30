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
        :amount="+tokenData.convertedBalance || 0"
        :symbol="tokenData.symbol"
        :aex9="isTokenAeCoin"
        :protocol="PROTOCOL_AETERNITY"
        dynamic-sizing
        no-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="isTokenAeCoin"
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
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { useStore } from 'vuex';
import { PROTOCOL_AETERNITY } from '@/constants';
import { ROUTE_COIN, ROUTE_MULTISIG_COIN, ROUTE_TOKEN } from '../../router/routeNames';
import { useCurrencies } from '../../../composables';

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
    const store = useStore();
    const {
      getCurrentCurrencyRate,
      getFormattedFiat,
      formatCurrency,
    } = useCurrencies({ store });

    /**
     * price and balanceFormatted are applicable only for AE Coin
     */
    const price = computed(() => formatCurrency(getCurrentCurrencyRate(PROTOCOL_AETERNITY)));
    const balanceFormatted = computed(
      () => getFormattedFiat(props.tokenData.convertedBalance || 0, PROTOCOL_AETERNITY),
    );

    const isTokenAeCoin = computed(() => props.tokenData.contractId === AE_CONTRACT_ID);

    const targetRouteName = computed(() => {
      if (props.isMultisig) {
        return ROUTE_MULTISIG_COIN;
      }
      if (isTokenAeCoin.value) {
        return ROUTE_COIN;
      }
      return ROUTE_TOKEN;
    });

    return {
      PROTOCOL_AETERNITY,
      isTokenAeCoin,
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
