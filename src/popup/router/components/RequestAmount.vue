<template>
  <RequestField
    v-validate="ownValidation ? validation : {
      required: true,
      min_value_exclusive: 0,
      ...+balance.minus(fee) > 0 ? { max_value: max } : {},
      enough_ae: fee.toString(),
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
    <template slot="left">
      <span
        v-if="!selectedToken"
        class="total-amount"
        data-cy="total-amount-currency"
      >
        <span v-if="$attrs.value">&thickapprox;</span>
        {{ `${formatCurrency(totalAmount)}` }}
      </span>
    </template>
    <template slot="right">
      <div class="asset-field">
        <AssetSelector
          class="asset-selector"
          @change="handleAssetSelection"
        />
        <span
          v-if="!selectedToken"
          class="asset-fiat-price"
          data-cy="amount-currency"
        >
          <span
            v-if="selectedAsset && selectedAsset.current_price"
          >
            {{ `@${formatCurrency(currentTokenFiatPrice)}` }}
          </span>
          <span v-else>
            @price: n/a
          </span>
        </span>
      </div>
    </template>
  </RequestField>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';
import RequestField from './RequestField.vue';
import AssetSelector from './AssetSelector.vue';

export default {
  components: {
    RequestField,
    AssetSelector,
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
      if (!this.selectedAsset || !this.selectedAsset.current_price) {
        return 0;
      }
      return ((this.$attrs.value || 0) * (this.selectedAsset.current_price).toFixed(2));
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

.input-amount {
  white-space: nowrap;

  :focus-within .asset-field .asset-selector {
    background-color: #171717;
  }

  .asset-field {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;

    .asset-selector {
      align-self: center;
      max-width: 70px;
      padding: 2px 12px;
      gap: 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 16px;
      height: 28px;
      margin-right: 2px;
      font-weight: 500;
      color: variables.$color-blue;
      border-color: #171717 transparent;
      margin-bottom: 2px;
    }

    .asset-fiat-price {
      color: variables.$color-dark-grey;

      @extend %face-sans-14-regular;
    }
  }

  .total-amount {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 150px;
    display: inline-block;
    text-align: left;
    color: variables.$color-dark-grey;

    @extend %face-sans-14-regular;
  }
}
</style>
