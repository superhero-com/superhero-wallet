<template>
  <InputField
    v-bind="$attrs"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :value="value"
    :label="label || $t('pages.tipPage.amountLabel')"
    :message="$attrs['message'] || errors.first('amount')"
    @input="$emit('input', $event)"
  >
    <template
      v-for="(index, name) in $slots"
      #[name]
    >
      <slot :name="name" />
    </template>
    <template #after="{ focused }">
      <InputSelectAsset
        v-if="!aeOnly"
        v-bind="$attrs"
        :value="currentAsset"
        :focused="focused"
        :show-tokens-with-balance="showTokensWithBalance"
        @input="handleAssetSelected($event)"
      />
      <div
        v-else
        class="ae-symbol"
      >
        AE
      </div>
    </template>

    <template #under="{ focused }">
      <div
        class="input-amount-desc"
        :class="{ focused }"
      >
        <span
          v-if="currentTokenFiatPrice && !hasError"
          class="input-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="value">&thickapprox;</span>
          {{ formatCurrency(totalAmount) }}
        </span>

        <span
          v-if="currentTokenFiatPrice"
          class="input-amount-desc-at"
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
import { pick } from 'lodash-es';
import InputField from './InputField.vue';
import InputSelectAsset from './InputSelectAsset.vue';

export default {
  components: {
    InputSelectAsset,
    InputField,
  },
  props: {
    value: { type: [String, Number], default: '' },
    label: { type: String, default: null },
    selectedAsset: { type: Object, default: null },
    aeOnly: Boolean,
    showTokensWithBalance: Boolean,
  },
  subscriptions() {
    return pick(this.$store.state.observables, [
      'balance',
      'balanceCurrency',
    ]);
  },
  data() {
    return {
      aeToken: null,
    };
  },
  computed: {
    ...mapGetters('fungibleTokens', ['getAeternityToken']),
    ...mapGetters([
      'formatCurrency',
      'account',
    ]),
    hasError() {
      return this.$validator.errors.has('amount');
    },
    totalAmount() {
      return (this.currentAsset?.current_price)
        ? ((+this.value || 0) * this.currentAsset.current_price).toFixed(2)
        : 0;
    },
    currentTokenFiatPrice() {
      return this.currentAsset?.current_price?.toFixed(2);
    },
    currentAsset() {
      return this.selectedAsset || this.aeToken;
    },
  },
  watch: {
    hasError(value) {
      return this.$emit('error', value);
    },
  },
  created() {
    this.aeToken = this.getAeternityToken({
      tokenBalance: this.balance,
      balanceCurrency: this.balanceCurrency,
    });
    if (!this.selectedAsset) {
      this.handleAssetSelected(this.aeToken);
    }
  },
  methods: {
    handleAssetSelected(asset) {
      this.$emit('asset-selected', asset);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.input-amount {
  &-desc {
    @include mixins.flex(space-between, center);

    &-total {
      word-break: break-word;

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

  .ae-symbol {
    @extend %face-sans-15-medium;

    color: variables.$color-primary;
  }
}
</style>
