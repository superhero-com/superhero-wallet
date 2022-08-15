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
    v-bind="$attrs"
    class="input-amount"
    type="number"
    name="amount"
    placeholder="0.00"
    new-design
    :label="$attrs.label || $t('pages.tipPage.amountLabel')"
    :error="$attrs.error || errors.has('amount')"
    :error-message="$attrs['error-message'] || errors.first('amount')"
    @input="$emit('input', $event)"
  >
    <template #right>
      <AssetSelector
        class="asset-selector"
        @change="handleAssetSelection"
      />
    </template>

    <template #under="{ focused }">
      <div
        class="request-amount-desc"
        :class="{ focused }"
      >
        <span
          v-if="!selectedToken"
          class="request-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="$attrs.value">&thickapprox;</span>
          {{ formatCurrency(totalAmount) }}
        </span>

        <span class="request-amount-desc-at">
          @{{
            (selectedAsset && selectedAsset.current_price)
              ? formatCurrency(currentTokenFiatPrice)
              : 'price: n/a'
          }}
        </span>
      </div>
    </template>
  </InputField>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';
import AssetSelector from './AssetSelector.vue';
import InputField from './InputField.vue';

export default {
  components: {
    AssetSelector,
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
      selectedAsset: null,
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
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
    totalAmount() {
      return !this.selectedAsset?.current_price
        ? 0
        : ((this.$attrs.value || 0) * (this.selectedAsset.current_price).toFixed(2));
    },
    currentTokenFiatPrice() {
      return `${this.selectedAsset.current_price.toFixed(2)}`;
    },
  },
  watch: {
    async selectedAsset() {
      await this.$validator.validateAll();
    },
    hasError(value) {
      return this.$emit('error', value);
    },
  },
  methods: {
    handleAssetSelection(newToken) {
      this.selectedAsset = newToken;
      this.$emit('handleAssetSelection', newToken);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.request-amount-desc {
  display: flex;
  justify-content: space-between;

  &-total {
    .focused & {
      color: rgba(variables.$color-white, 0.75);
    }
  }

  &-at {
    margin-left: 0;
  }
}
</style>
