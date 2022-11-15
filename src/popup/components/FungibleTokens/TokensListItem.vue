<template>
  <Component
    :is="preventNavigation ? 'BtnPlain' : 'RouterLink'"
    v-if="tokenData"
    class="tokens-list-item"
    :class="{ extend: preventNavigation, 'asset-selector': assetSelector }"
    :to="preventNavigation ? null : {
      name: targetRouteName,
      params: { id: tokenData.contractId },
    }"
    @click="(event) => $emit('click', event)"
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
  </Component>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { AETERNITY_CONTRACT_ID } from '../../utils/constants';
import TokenAmount from '../TokenAmount.vue';
import BtnPlain from '../buttons/BtnPlain.vue';
import Tokens from '../Tokens.vue';

export default {
  components: {
    TokenAmount,
    Tokens,
    BtnPlain,
  },
  props: {
    tokenData: { type: Object, default: null },
    preventNavigation: Boolean,
    showCurrentPrice: Boolean,
    assetSelector: Boolean,
  },
  data: () => ({
    AETERNITY_CONTRACT_ID,
  }),
  computed: {
    ...mapGetters(['convertToCurrencyFormatted', 'formatCurrency', 'convertToCurrency']),
    ...mapState('fungibleTokens', ['aePublicData']),
    price() {
      return this.formatCurrency(this.aePublicData?.current_price || 0);
    },
    targetRouteName() {
      return this.tokenData.contractId === AETERNITY_CONTRACT_ID ? 'coin-details' : 'token-details';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tokens-list-item {
  display: block;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  color: unset;
  text-decoration: unset;

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  &:active {
    opacity: 0.5;
  }

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

  &.asset-selector {
    padding: 8px;
    transition: background-color 0.12s ease-in-out;
    background-color: variables.$color-bg-4;

    &.selected {
      background-color: rgba(variables.$color-primary, 0.2);
    }

    &:hover {
      background-color: variables.$color-bg-4-hover;
    }

    .price {
      font-weight: 400;
    }
  }
}
</style>
