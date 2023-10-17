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
          :protocol="PROTOCOL_AETERNITY"
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
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { PROTOCOL_AETERNITY } from '@/constants';
import { camelCase } from 'lodash-es';

import {
  getTransactionTokenInfoResolver,
  isTxFunctionDexSwap,
  isTxFunctionDexPool,
} from '@/protocols/aeternity/helpers';
import type {
  ITransaction,
  TxFunctionParsed,
} from '@/types';
import { useFungibleTokens } from '@/composables';

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
  setup(props) {
    const { availableTokens } = useFungibleTokens();

    const isSwapTx = computed(() => (
      isTxFunctionDexSwap(props.transaction.tx.function)
      || isTxFunctionDexPool(props.transaction.tx.function)
    ));

    const rates = computed(() => {
      if (!isSwapTx.value) {
        return [];
      }

      const resolver = getTransactionTokenInfoResolver(
        camelCase(props.transaction.tx.function) as TxFunctionParsed,
      );

      if (!resolver) return [];

      const { tokens } = resolver(props.transaction, availableTokens.value);

      if (tokens?.length <= 1) {
        return [];
      }

      const hasAmount = tokens.every((token) => !!token.amount);

      const tokenAmount = [
        Number(tokens[0].amount),
        Number(tokens[1].amount),
      ];

      return [
        {
          from: tokens[0],
          to: tokens[1],
          price: hasAmount ? tokenAmount[1] / tokenAmount[0] : 0,
        }, {
          from: tokens[1],
          to: tokens[0],
          price: hasAmount ? tokenAmount[0] / tokenAmount[1] : 0,
        },
      ];
    });

    return {
      PROTOCOL_AETERNITY,
      availableTokens,
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
