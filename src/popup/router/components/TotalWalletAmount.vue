<template>
  <div class="total-amount">
    <span>{{ totalAmount }}</span>
    <span class="label">
      {{ $t('total') }}
    </span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';

export default {
  subscriptions() {
    return pick(this.$store.state.observables, ['balances']);
  },
  computed: {
    ...mapGetters(['convertToCurrencyFormatted']),
    totalAmount() {
      if (!this.balances?.length) return 0;
      const total = this.balances.reduce(
        (previousValue, currentValue) => previousValue.plus(currentValue),
        BigNumber(0),
      );
      return this.convertToCurrencyFormatted(total);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';
@use '../../../styles/variables';

.total-amount {
  @extend %face-sans-16-bold;

  color: variables.$color-white;
  line-height: 18px;
  margin-bottom: 12px;
  margin-left: 24px;

  .label {
    @extend %face-sans-14-medium;

    margin-left: 6px;
    line-height: 18px;
    opacity: 0.5;
  }
}
</style>
