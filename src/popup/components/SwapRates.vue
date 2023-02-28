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
        <Tokens
          :tokens="[rate.from]"
          no-icons
        />
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
        <Tokens
          :tokens="[rate.to]"
          no-icons
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import { transactionTokenInfoResolvers } from '../utils/transactionTokenInfoResolvers';
import { FUNCTION_TYPE_DEX } from '../utils/constants';
import { useFungibleTokens } from '../../composables';
import { ITransaction, TxFunctionParsed, TxFunctionRaw } from '../../types';

import Tokens from './Tokens.vue';
import TokenAmount from './TokenAmount.vue';

export default defineComponent({
  components: {
    Tokens,
    TokenAmount,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const { availableTokens } = useFungibleTokens({ store: root.$store });

    const isSwapTx = computed(() => ([
      ...FUNCTION_TYPE_DEX.swap,
      ...FUNCTION_TYPE_DEX.pool,
    ].includes(props.transaction.tx.function as TxFunctionRaw)));

    const rates = computed(() => {
      if (!isSwapTx.value) {
        return [];
      }

      const functionName = camelCase(props.transaction.tx.function) as TxFunctionParsed;

      const resolver = transactionTokenInfoResolvers[functionName];

      if (!resolver) return [];

      const { tokens } = resolver(props.transaction, availableTokens.value);

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
    });

    return {
      isSwapTx,
      rates,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.swap-rates {
  width: 100%;

  .title {
    color: variables.$color-grey-dark;
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

      @extend %face-sans-15-medium;
    }

    div {
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>
