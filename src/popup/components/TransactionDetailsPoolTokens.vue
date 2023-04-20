<template>
  <div class="pool-tokens">
    <TransactionDetailsPoolTokenRow
      v-for="(token, index) in tokens"
      :key="index"
      :token="token"
      :tokens="tokens"
      :hide-amount="hideAmount"
      :label="$t(`pages.transactionDetails.${getLabel(token.isPool)}`)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import {
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_ALLOW_TOKEN,
  aettosToAe,
  convertToken,
} from '../utils';
import { ITransaction, TxFunctionRaw } from '../../types';

import TransactionDetailsPoolTokenRow from './TransactionDetailsPoolTokenRow.vue';
import { useTransactionTokens } from '../../composables';

export default defineComponent({
  components: {
    TransactionDetailsPoolTokenRow,
  },
  props: {
    transaction: {
      type: Object as PropType<ITransaction>,
      required: true,
    },
    txFunction: {
      type: String as PropType<TxFunctionRaw>,
      required: true,
    },
    direction: {
      type: String,
      required: true,
    },
    hideAmount: Boolean,
    isAllowance: Boolean,
  },
  setup(props, { root }) {
    const { tokens } = useTransactionTokens({
      store: root.$store,
      transaction: props.transaction,
      direction: props.direction,
      isAllowance: props.isAllowance,
      showDetailedAllowanceInfo: true,
    });

    function getLabel(isPool: boolean) {
      const tag = DEX_TRANSACTION_TAGS[props.txFunction];
      if (tag === DEX_ALLOW_TOKEN) return 'approveTokenUse';
      const provideLiquidity = tag === DEX_PROVIDE_LIQUIDITY;
      if (isPool) return provideLiquidity ? 'poolTokenReceived' : 'poolTokenSpent';
      return provideLiquidity ? 'deposited' : 'withdrawn';
    }

    return {
      tokens,
      aettosToAe,
      convertToken,
      getLabel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.pool-tokens {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 16px;
}
</style>
