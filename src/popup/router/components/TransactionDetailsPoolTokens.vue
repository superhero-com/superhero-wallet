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

<script>
import { getDexTransactionTag } from '../../utils';
import { aettosToAe, convertToken } from '../../utils/helper';
import TransactionDetailsPoolTokenRow from './TransactionDetailsPoolTokenRow.vue';

export default {
  components: {
    TransactionDetailsPoolTokenRow,
  },
  props: {
    tokens: {
      type: Array,
      required: true,
    },
    txFunction: {
      type: String,
      required: true,
    },
    hideAmount: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    aettosToAe,
    convertToken,
    getLabel(isPool) {
      const tag = getDexTransactionTag[this.txFunction];
      if (tag === 'allow_token') return 'approveTokenUse';
      const provideLiquidity = tag === 'provide_liquidity';
      if (isPool) return provideLiquidity ? 'poolTokenReceived' : 'poolTokenSpent';
      return provideLiquidity ? 'deposited' : 'withdrawn';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.pool-tokens {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 16px;
}
</style>
