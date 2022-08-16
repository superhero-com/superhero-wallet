<template>
  <InputField
    v-validate="{
      required,
      min_value_exclusive: 0,
      enough_ae: fee.toString(),
      ...validation,
    }"
    v-bind="$attrs"
    class="request-amount"
    type="number"
    name="amount"
    placeholder="0.00"
    new-ui
    :value="value"
    :label="$attrs.label || $t('pages.tipPage.amountLabel')"
    :error="$attrs.error || errors.has('amount')"
    :error-message="$attrs['error-message'] || errors.first('amount')"
    @input="$emit('input', $event)"
  >
    <template #right>
      <AssetSelector
        v-model="selectedAsset"
        class="request-amount-asset"
      />
    </template>

    <template #under="{ focused }">
      <div
        class="request-amount-desc"
        :class="{ focused }"
      >
        <span
          v-if="currentTokenFiatPrice && !hasError"
          class="request-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="value">&thickapprox;</span>
          {{ formatCurrency(totalAmount) }}
        </span>
        <span v-else>-</span>

        <span class="request-amount-desc-at">
          @{{
            (currentTokenFiatPrice)
              ? formatCurrency(currentTokenFiatPrice)
              : $t('priceNotAvailable')
          }}
        </span>
      </div>
    </template>
  </InputField>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import AssetSelector from './AssetSelector.vue';
import InputField from './InputField.vue';

export default {
  components: {
    AssetSelector,
    InputField,
  },
  props: {
    value: { type: [String, Number], default: '' },
    validation: { type: Object, default: () => ({}) },
    required: Boolean,
  },
  data() {
    return {
      fee: BigNumber(0),
      selectedAsset: null,
    };
  },
  computed: {
    ...mapGetters([
      'formatCurrency',
      'account',
    ]),
    hasError() {
      return this.$validator.errors.has('amount');
    },
    totalAmount() {
      return (this.selectedAsset?.current_price)
        ? ((+this.value || 0) * this.selectedAsset.current_price).toFixed(2)
        : 0;
    },
    currentTokenFiatPrice() {
      return this.selectedAsset?.current_price?.toFixed(2);
    },
  },
  watch: {
    async selectedAsset(val) {
      this.$emit('asset-selected', val);
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
@use '../../../styles/mixins';

.request-amount {
  &-desc {
    @include mixins.flex(space-between, center);

    &-total {
      .focused & {
        color: rgba(variables.$color-white, 0.75);
      }
    }

    &-at {
      margin-left: auto;
    }
  }

  &-asset {
    margin-right: -2px; // Compensate visually the roundness of the input
  }
}
</style>
