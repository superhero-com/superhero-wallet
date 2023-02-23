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
    :extend="preventNavigation"
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
        {{ balanceFormatted }}
      </div>
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import type { IAsset, IToken } from '../../../types';
import { AETERNITY_CONTRACT_ID } from '../../utils/constants';
import { ROUTE_COIN, ROUTE_MULTISIG_COIN, ROUTE_TOKEN } from '../../router/routeNames';
import { useCurrencies } from '../../../composables';
import { useState } from '../../../composables/vuex';

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
    const { getFormattedFiat, formatCurrency } = useCurrencies();

    const aePublicData = useState<IAsset>('fungibleTokens', 'aePublicData');

    const price = computed(() => formatCurrency(aePublicData.value?.current_price || 0));

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
