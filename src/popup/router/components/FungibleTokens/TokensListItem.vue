<template>
  <RouterLink
    v-if="tokenData"
    class="tokens-list-item"
    :to="{
      name: 'token-details',
      params: { id: tokenData.contractId },
    }"
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
      v-if="tokenData.contractId == 'aeternity'"
      class="row"
    >
      <div class="price">
        @ {{ formatCurrency(aePublicData.current_price) }}
      </div>
      <div class="price">
        {{ convertToCurrencyFormatted(tokenData.convertedBalance) }}
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import TokenAmount from '../TokenAmount.vue';
import Tokens from '../Tokens.vue';

export default {
  components: { TokenAmount, Tokens },
  props: { tokenData: { type: Object, default: null } },
  computed: {
    ...mapGetters(['convertToCurrencyFormatted', 'formatCurrency']),
    ...mapState('fungibleTokens', ['aePublicData']),
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.tokens-list-item {
  display: block;
  padding: 8px 16px;
  color: unset;
  text-decoration: unset;
  background-color: variables.$color-bg-1;

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
      padding-left: 4px;
    }
  }

  ::v-deep .token-amount {
    @extend %face-sans-15-regular;

    margin-top: -5px;
  }

  .price {
    color: rgba(variables.$color-white, 0.75);
    font-weight: 100;
    margin-top: -5px;

    @extend %face-sans-14-regular;
  }
}
</style>
