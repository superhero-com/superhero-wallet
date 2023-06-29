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
    :extend="preventNavigation"
    :selected="selected"
  >
    <div class="row">
      <Tokens
        :tokens="[tokenData]"
        icon-size="lg"
        full-ae-symbol
        bright
      />
      <TokenAmount
        :amount="+tokenData.convertedBalance || 0"
        :symbol="tokenData.symbol"
        :aex9="tokenData.contractId !== AETERNITY_CONTRACT_ID"
        dynamic-sizing
        no-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="tokenData.contractId === AETERNITY_CONTRACT_ID"
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
import type { IToken } from '../../../types';
import { AETERNITY_CONTRACT_ID } from '../../utils';
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
    const { currentCurrencyRate, getFormattedFiat, formatCurrency } = useCurrencies();

    const price = computed(() => formatCurrency(currentCurrencyRate.value));

    const balanceFormatted = computed(
      () => getFormattedFiat(props.tokenData.convertedBalance || 0),
    );

    const targetRouteName = computed(() => {
      if (props.isMultisig) {
        return ROUTE_MULTISIG_COIN;
      }
      if (props.tokenData.contractId === AETERNITY_CONTRACT_ID) {
        return ROUTE_COIN;
      }
      return ROUTE_TOKEN;
    });

    return {
      AETERNITY_CONTRACT_ID,
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
