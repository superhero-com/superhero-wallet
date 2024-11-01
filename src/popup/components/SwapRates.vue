<template>
  <DetailsItem
    v-if="rates.length"
    class="swap-rates"
    :label="$t('pages.transactionDetails.rates')"
  >
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
          :protocol="PROTOCOLS.aeternity"
          class="price"
          hide-fiat
          hide-symbol
          high-precision
        />
        <Tokens
          :tokens="[rate.to]"
          no-icons
        />
      </div>
    </div>
  </DetailsItem>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  toRef,
} from 'vue';

import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { getTransactionTokenInfoResolver } from '@/protocols/aeternity/helpers';
import { useFungibleTokens, useTransactionData } from '@/composables';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';

import DetailsItem from './DetailsItem.vue';
import Tokens from './Tokens.vue';
import TokenAmount from './TokenAmount.vue';

export default defineComponent({
  components: {
    DetailsItem,
    Tokens,
    TokenAmount,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props) {
    const { getProtocolAvailableTokens } = useFungibleTokens();
    const { tokenSaleAddressToTokenContractAddress } = useAeTokenSales();

    const { isDexSwap, txFunctionParsed, isTokenSale } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    const rates = computed(() => {
      if (!isDexSwap.value || !isTokenSale.value || !txFunctionParsed.value) {
        return [];
      }

      const resolver = getTransactionTokenInfoResolver(txFunctionParsed.value);
      if (!resolver) {
        return [];
      }

      const { tokens } = resolver(
        props.transaction,
        getProtocolAvailableTokens(PROTOCOLS.aeternity),
        tokenSaleAddressToTokenContractAddress,
      );

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
      PROTOCOLS,
      rates,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.swap-rates {
  width: 100%;

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
