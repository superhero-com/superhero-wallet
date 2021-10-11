<template>
  <InputField
    class="input-amount"
    type="number"
    v-bind="$attrs"
    :error="$attrs.error || !!$attrs.value && $attrs.value <= 0"
    :error-message="$attrs['error-message'] || $t('pages.tipPage.insufficientAmountError')"
    placeholder="0.00"
    :label="$attrs.label || $t('pages.tipPage.amountLabel')"
    @input="$emit('input', $event)"
  >
    <template slot="right">
      <span class="token">{{ selectedToken ? selectedToken.symbol : 'AE' }}</span>
      <span
        class="amount"
        data-cy="amount-currency"
      >
        {{ `(${formatCurrency(selectedToken ? 0 : currencyAmount)})` }}
      </span>
    </template>
  </InputField>
</template>

<script>
import { mapGetters } from 'vuex';
import InputField from './InputField.vue';

export default {
  components: {
    InputField,
  },
  computed: {
    ...mapGetters(['formatCurrency']),
    ...mapGetters('fungibleTokens', ['selectedToken']),
    currencyAmount() {
      return ((this.$attrs.value || 0) * this.$store.getters.currentCurrencyRate).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-amount {
  white-space: nowrap;

  .token {
    margin-right: 2px;
    font-weight: 500;
    color: variables.$color-blue;
  }

  .amount {
    color: variables.$color-dark-grey;
  }
}
</style>
