<template>
  <span class="format-fiat-currency">{{ formattedBalance }}</span>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    balance: { type: [String, Number], default: 0 },
  },
  computed: {
    ...mapGetters(['formatCurrency']),
    formattedBalance() {
      return `(~ ${this.formatCurrency(this.balance)})`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.format-fiat-currency {
  color: $gray-2;
  font-size: 13px;
}
</style>
