<template>
  <InputField
    v-bind="$attrs"
    class="request-amount"
    type="number"
    placeholder="0.00"
    new-ui
    :value="value"
    :label="label || $t('pages.tipPage.amountLabel')"
    :error-message="$attrs['error-message'] || errors.first('amount')"
    @input="$emit('input', $event)"
  >
    <slot
      v-for="slot in Object.keys($slots)"
      :slot="slot"
      :name="slot"
    />
    <template #after="{ focused }">
      <SelectAsset
        v-bind="$attrs"
        :value="selectedAsset"
        :focused="focused"
        @input="$emit('asset-selected', $event)"
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

        <span
          v-if="currentTokenFiatPrice"
          class="request-amount-desc-at"
        >
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
import InputField from './InputField.vue';
import SelectAsset from './SelectAsset.vue';

export default {
  components: {
    SelectAsset,
    InputField,
  },
  props: {
    value: { type: [String, Number], default: '' },
    label: { type: String, default: null },
    selectedAsset: { type: Object, default: null },
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
    hasError(value) {
      return this.$emit('error', value);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
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
