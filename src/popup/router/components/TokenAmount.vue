<template>
  <span class="token-amount">
    {{ amountRounded }}
    <span class="symbol">{{ symbol }}</span>
    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
    <span v-if="amountFiat" class="fiat">({{ amountFiat }})</span>
  </span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'AE' },
  },
  computed: {
    amountRounded() {
      return +this.amount.toFixed(2);
    },
    ...mapState({
      amountFiat(state, { convertToCurrencyFormatted }) {
        if (!this.amountRounded || this.symbol !== 'AE') return false;
        return convertToCurrencyFormatted(this.amount);
      },
    }),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.token-amount {
  color: $white-color;

  .symbol {
    color: $secondary-color;
  }

  .fiat {
    color: $gray-2;
  }
}
</style>
