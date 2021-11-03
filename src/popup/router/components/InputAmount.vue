<template>
  <InputField
    v-validate="ownValidation ? validation : {
      required: true,
      min_value_exclusive: 0,
      ...+balance.minus(getFee) > 0 ? { max_value: max } : {},
      enough_ae: getFee.toString(),
      not_token: noToken,
      ...validation,
    }"
    name="amount"
    :error="$attrs.error || errors.has('amount')"
    :error-message="$attrs['error-message'] || errors.first('amount')"
    class="input-amount"
    type="number"
    v-bind="$attrs"
    placeholder="0.00"
    :label="$attrs.label || $t('pages.tipPage.amountLabel')"
    @input="$emit('input', $event)"
  >
    <template slot="right">
      <span class="token">{{ selectedToken ? selectedToken.symbol : 'AE' }}</span>
      <span
        v-if="!selectedToken"
        class="amount"
        data-cy="amount-currency"
      >
        {{ `(${formatCurrency(currencyAmount)})` }}
      </span>
    </template>
  </InputField>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import InputField from './InputField.vue';

export default {
  components: {
    InputField,
  },
  props: {
    noToken: { type: Boolean },
    ownValidation: { type: Boolean },
    validation: { type: Object, default: null },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapGetters(['formatCurrency', 'getFee']),
    ...mapGetters('fungibleTokens', ['selectedToken']),
    hasError() {
      return this.$validator.errors.has('amount');
    },
    max() {
      return (this.selectedToken && !this.noToken
        ? this.selectedToken.balance
        : this.balance.minus(this.getFee)).toString();
    },
    currencyAmount() {
      return ((this.$attrs.value || 0) * this.$store.getters.currentCurrencyRate).toFixed(2);
    },
  },
  watch: {
    async selectedToken() {
      await this.$validator.validateAll();
    },
    hasError(value) {
      return this.$emit('error', value);
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
