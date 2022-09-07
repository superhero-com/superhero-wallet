<template>
  <Component
    :is="preventNavigation ? 'ButtonPlain' : 'RouterLink'"
    v-if="tokenData"
    class="tokens-list-item"
    :class="{ extend: preventNavigation, 'asset-selector': assetSelector }"
    :to="preventNavigation ? null : {
      name: 'token-details',
      params: { id: tokenData.contractId },
    }"
    @click="(event) => $emit('click', event)"
  >
    <div class="row">
      <div class="left">
        <Tokens :tokens="[tokenData]" />
      </div>
      <TokenAmount
        :amount="+tokenData.convertedBalance || 0"
        :symbol="tokenData.symbol"
        :aex9="tokenData.contractId !== 'aeternity'"
        no-symbol
        hide-fiat
      />
    </div>
    <div
      v-if="tokenData.contractId === 'aeternity'"
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
import BigNumber from 'bignumber.js';
import TokenAmount from '../TokenAmount.vue';
import ButtonPlain from '../ButtonPlain.vue';
import Tokens from '../Tokens.vue';

export default {
  components: { TokenAmount, Tokens, ButtonPlain },
  props: {
    tokenData: { type: Object, default: null },
    preventNavigation: Boolean,
    showCurrentPrice: Boolean,
    assetSelector: Boolean,
  },
  computed: {
    ...mapGetters(['convertToCurrencyFormatted', 'formatCurrency', 'convertToCurrency']),
    ...mapState('fungibleTokens', ['aePublicData']),
    price() {
      return this.formatCurrency(this.aePublicData?.current_price
      || this.tokenData?.convertedBalance
        ? BigNumber(this.convertToCurrency(this.tokenData.convertedBalance))
          .div(+this.tokenData.convertedBalance)
        : 0);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

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
      width: 30px;
      height: 30px;
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
      color: variables.$color-light-grey;
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
      background-color: rgba(variables.$color-blue, 0.2);
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
