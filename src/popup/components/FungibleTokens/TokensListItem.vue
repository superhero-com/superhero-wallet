<template>
  <ListItemWrapper
    v-if="tokenData"
    class="tokens-list-item"
    :to="preventNavigation ? null : {
      name: targetRouteName,
      params: {
        id: tokenData.contractId,
      },
    }"
    :selected="selected"
    v-on="$listeners"
  >
    <div class="row">
      <div class="left">
        <Tokens
          :tokens="[tokenData]"
          icon-size="xl"
        />
      </div>
      <TokenAmount
        :amount="+tokenData.convertedBalance || 0"
        :symbol="tokenData.symbol"
        :aex9="tokenData.contractId !== AETERNITY_CONTRACT_ID"
        no-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="tokenData.contractId === AETERNITY_CONTRACT_ID"
      class="row"
    >
      <div class="price">
        @ {{ price }}
      </div>
      <div class="price">
        {{ convertToCurrencyFormatted(tokenData.convertedBalance) }}
      </div>
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { AETERNITY_CONTRACT_ID } from '../../utils/constants';
import { ROUTE_COIN, ROUTE_TOKEN } from '../../router/routeNames';
import { useFungibleTokens } from '../../../composables';
import { useGetter } from '../../../composables/vuex';

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
    tokenData: { type: Object, default: null },
    preventNavigation: Boolean,
    showCurrentPrice: Boolean,
    selected: Boolean,
  },
  setup(props, { root }) {
    const { aePublicData } = useFungibleTokens({ store: root.$store });
    const formatCurrency = useGetter('formatCurrency');
    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const price = computed(() => formatCurrency.value(aePublicData.value?.current_price || 0));

    const targetRouteName = computed(() => (
      (props.tokenData.contractId === AETERNITY_CONTRACT_ID)
        ? ROUTE_COIN
        : ROUTE_TOKEN
    ));

    return {
      price,
      targetRouteName,
      convertToCurrencyFormatted,
      AETERNITY_CONTRACT_ID,
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
  }

  ::v-deep .tokens {
    padding-bottom: 4px;

    img {
      border-radius: 15px;
      margin-right: 0;
    }

    .symbols {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
      line-height: 28px;
      padding-left: 4px;
    }
  }

  ::v-deep .token-amount {
    @extend %face-sans-15-regular;

    margin-top: -5px;
  }

  .price {
    @extend %face-sans-14-regular;

    &:last-child {
      color: variables.$color-grey-light;
    }

    color: rgba(variables.$color-white, 0.75);
    font-weight: 100;
    margin-top: -5px;
  }
}
</style>
