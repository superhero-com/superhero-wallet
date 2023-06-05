<template>
  <InputField
    v-bind="$attrs"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :value="value"
    :label="label"
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
        v-text="AETERNITY_SYMBOL"
      />
    </template>

    <template #under="{ focused }">
      <div
        class="input-amount-desc"
        :class="{ focused }"
      >
        <span
          v-if="currentAssetFiatPrice && !hasError"
          class="input-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="value">&thickapprox;</span>
          {{ totalAmountFormatted }}
        </span>

        <span
          v-if="currentAssetFiatPrice"
          class="input-amount-desc-at"
        >
          @{{
            (currentAssetFiatPrice)
              ? currentAssetFiatPriceFormatted
              : $t('common.priceNotAvailable')
          }}
        </span>
      </div>
    </template>
  </InputField>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  watch,
} from '@vue/composition-api';
import { useBalances, useCurrencies } from '../../composables';
import type { IAsset } from '../../types';
import { AETERNITY_CONTRACT_ID, AETERNITY_SYMBOL } from '../utils';
import InputField from './InputField.vue';
import InputSelectAsset from './InputSelectAsset.vue';

export default defineComponent({
  components: {
    InputSelectAsset,
    InputField,
  },
  props: {
    value: { type: [String, Number], default: '' },
    label: { type: String, default: null },
    selectedAsset: { type: Object as PropType<IAsset | null>, default: null },
    aeOnly: Boolean,
    showTokensWithBalance: Boolean,
  },
  setup(props, { root, emit }) {
    const { aeternityToken } = useBalances({ store: root.$store });
    const { currentCurrencyRate, formatCurrency } = useCurrencies();

    const currentAsset = computed((): IAsset => props.selectedAsset || aeternityToken.value);
    const hasError = computed(() => (root as any).$validator.errors.has('amount'));
    const isAssetAe = computed(() => currentAsset.value.contractId === AETERNITY_CONTRACT_ID);
    const currentAssetFiatPrice = computed(
      () => (isAssetAe.value) ? currentCurrencyRate.value : 0,
    );
    const currentAssetFiatPriceFormatted = computed(
      () => formatCurrency(currentAssetFiatPrice.value),
    );
    const totalAmountFormatted = computed(() => formatCurrency(
      (currentAssetFiatPrice.value)
        ? (+props.value || 0) * currentAssetFiatPrice.value
        : 0,
    ));

    function handleAssetSelected(asset: IAsset) {
      emit('asset-selected', asset);
    }

    watch(hasError, (val) => emit('error', val));

    onMounted(() => {
      if (!props.selectedAsset) {
        handleAssetSelected(aeternityToken.value);
      }
    });

    return {
      currentCurrencyRate,
      AETERNITY_SYMBOL,
      totalAmountFormatted,
      currentAssetFiatPrice,
      currentAssetFiatPriceFormatted,
      currentAsset,
      hasError,
      formatCurrency,
      handleAssetSelected,
    };
  },
});
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

    white-space: nowrap;
    color: variables.$color-primary;
  }
}
</style>
