<template>
  <InputField
    v-bind="$attrs"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :model-value="modelValue"
    :label="label"
    :message="$attrs['message']"
    @update:modelValue="$emit('update:modelValue', $event)"
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
        data-cy="select-asset"
        :value="currentAsset"
        :focused="focused"
        :show-tokens-with-balance="showTokensWithBalance"
        @select-asset="handleAssetSelected($event)"
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
          v-if="currentAssetFiatPrice"
          class="input-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="modelValue">&thickapprox;</span>
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
} from 'vue';
import { useStore } from 'vuex';
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
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: null },
    selectedAsset: { type: Object as PropType<IAsset | null>, default: null },
    aeOnly: Boolean,
    showTokensWithBalance: Boolean,
  },
  emits: ['update:modelValue', 'asset-selected'],
  setup(props, { emit }) {
    const store = useStore();

    const { aeternityCoin } = useBalances({ store });
    const { currentCurrencyRate, formatCurrency } = useCurrencies();

    const currentAsset = computed((): IAsset => props.selectedAsset || aeternityCoin.value);
    const isAssetAe = computed(() => currentAsset.value.contractId === AETERNITY_CONTRACT_ID);
    const currentAssetFiatPrice = computed(
      () => (isAssetAe.value) ? currentCurrencyRate.value : 0,
    );
    const currentAssetFiatPriceFormatted = computed(
      () => formatCurrency(currentAssetFiatPrice.value),
    );
    const totalAmountFormatted = computed(() => formatCurrency(
      (currentAssetFiatPrice.value)
        ? (+props.modelValue || 0) * currentAssetFiatPrice.value
        : 0,
    ));

    function handleAssetSelected(asset: IAsset) {
      emit('asset-selected', asset);
    }

    onMounted(() => {
      if (!props.selectedAsset) {
        handleAssetSelected(aeternityCoin.value);
      }
    });

    return {
      currentCurrencyRate,
      AETERNITY_SYMBOL,
      totalAmountFormatted,
      currentAssetFiatPrice,
      currentAssetFiatPriceFormatted,
      currentAsset,
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

    user-select: none;

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
    user-select: none;
  }
}
</style>
