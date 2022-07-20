<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <AeBalance :balance="Number(balances[idx])" />
    <div class="display-value">
      {{ formatCurrency(balances[idx] * currentCurrencyRate) }}
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import AeBalance from './AeBalance.vue';

export default {
  components: { AeBalance },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balances']);
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['formatCurrency', 'currentCurrencyRate', 'accounts']),
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.balance-info {
  display: flex;
  flex-direction: column;
  align-items: center;

  .display-value {
    @extend %face-sans-16-medium;

    line-height: 18px;
    margin-top: 4px;
    opacity: 0.75;
  }
}
</style>
