<template>
  <div
    v-if="rates.length"
    class="swap-rates"
  >
    <div class="title">
      {{ $t('pages.transactionDetails.rates') }}
    </div>

    <div
      v-for="(rate, idx) of rates"
      :key="idx"
      class="rate"
    >
      <div>
        <span class="price">1</span>
        <Tokens :tokens="[rate.from]" />
      </div>
      <div>
        <TokenAmount
          :amount="rate.price"
          class="price"
          hide-fiat
          no-symbol
          aex9
          high-precision
        />
        <Tokens :tokens="[rate.to]" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { camelCase } from 'lodash-es';
import Tokens from './Tokens.vue';
import TokenAmount from './TokenAmount.vue';
import * as transactionTokenInfoResolvers from '../../utils/transactionTokenInfoResolvers';
import { FUNCTION_TYPE_DEX } from '../../utils/constants';

export default {
  components: {
    Tokens,
    TokenAmount,
  },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    isSwapTx() {
      return [
        ...FUNCTION_TYPE_DEX.swap,
        ...FUNCTION_TYPE_DEX.pool,
      ].includes(this.transaction.tx.function);
    },
    rates() {
      if (!this.isSwapTx) return [];

      if (!transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)]) return [];

      const { tokens } = transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)](
        this.transaction, this.availableTokens,
      );

      if (tokens.length <= 1) return [];

      return [
        {
          from: tokens[0],
          to: tokens[1],
          price: tokens[1].amount / tokens[0].amount,
        }, {
          from: tokens[1],
          to: tokens[0],
          price: tokens[0].amount / tokens[1].amount,
        },
      ];
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.swap-rates {
  width: 100%;

  .title {
    color: variables.$color-dark-grey;
    padding-bottom: 8px;

    @extend %face-sans-14-medium;
  }

  .rate {
    padding-bottom: 6px;
    width: 100%;
    display: inline-flex;
    justify-content: space-between;
    align-items: center;

    .price {
      padding-right: 4px;

      @extend %face-sans-14-medium;
    }

    div {
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>
