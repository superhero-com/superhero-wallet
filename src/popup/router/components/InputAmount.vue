<template>
  <InputField
    v-validate="ownValidation ? validation : {
      required: true,
      min_value_exclusive: 0,
      ...+balance.minus(fee) > 0 ? { max_value: max } : {},
      enough_ae: fee.toString(),
      not_token: noToken,
      ...validation,
    }"
    name="amount"
    :error-message="$attrs['error-message'] || errors.first('amount')"
    class="input-amount"
    type="number"
    v-bind="$attrs"
    placeholder="0.00"
    :label="$attrs.label || $t('pages.tipPage.amountLabel')"
    @input="$emit('input', $event)"
  >
    <template #after>
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
import { mapState, mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { calculateFee } from '../../utils/helper';
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
  data() {
    return {
      fee: BigNumber(0),
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapState(['sdk']),
    ...mapGetters(['formatCurrency', 'account']),
    ...mapGetters('fungibleTokens', ['selectedToken']),
    hasError() {
      return this.$validator.errors.has('amount');
    },
    max() {
      return (this.selectedToken && !this.noToken
        ? this.selectedToken.balance
        : this.balance.minus(this.fee)).toString();
    },
    currencyAmount() {
      return ((this.$attrs.value || 0) * this.$store.getters.currentCurrencyRate).toFixed(2);
    },
  },
  watch: {
    async selectedToken() {
      await this.$validator.validateAll();
      this.fetchFee();
    },
    hasError(value) {
      return this.$emit('error', value);
    },
  },
  async mounted() {
    await this.fetchFee();
  },
  methods: {
    async fetchFee() {
      await this.$watchUntilTruly(() => this.sdk);
      this.fee = calculateFee(
        !this.selectedToken ? SCHEMA.TX_TYPE.spend : SCHEMA.TX_TYPE.contractCall, {
          ...this.sdk.Ae.defaults,
          ...(this.selectedToken && {
            callerId: this.account.address,
            contractId: this.selectedToken.contractId,
          }),
        },
      );
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
