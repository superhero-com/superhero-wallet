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
        v-if="!aeOnlyOrNoConnection"
        v-bind="$attrs"
        :value="currentAsset"
        :focused="focused"
        :show-tokens-with-balance="showTokensWithBalance"
        :disabled="!isOnline || !isMiddlewareReady"
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
          v-if="currentTokenFiatPrice && !hasError"
          class="input-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="value">&thickapprox;</span>
          {{ totalAmountFormatted }}
        </span>

        <span
          v-if="currentTokenFiatPrice"
          class="input-amount-desc-at"
        >
          @{{
            (currentTokenFiatPrice)
              ? currentTokenFiatPriceFormatted
              : $t('priceNotAvailable')
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
import {
  useBalances,
  useConnection,
  useCurrencies,
  useMiddleware,
} from '../../composables';
import type { IAsset } from '../../types';
import { AETERNITY_SYMBOL } from '../utils';
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
    const { isOnline } = useConnection();
    const { isMiddlewareReady } = useMiddleware({ store: root.$store });
    const { formatCurrency } = useCurrencies();
    const { aeternityToken } = useBalances({ store: root.$store });

    const currentAsset = computed((): IAsset => props.selectedAsset || aeternityToken.value);
    const hasError = computed(() => (root as any).$validator.errors.has('amount'));
    const aeOnlyOrNoConnection = computed(
      () => props.aeOnly || !isOnline.value || !isMiddlewareReady.value,
    );
    const totalAmountFormatted = computed(() => formatCurrency(
      (currentAsset.value?.current_price)
        ? (+props.value || 0) * currentAsset.value.current_price
        : 0,
    ));
    const currentTokenFiatPrice = computed(() => currentAsset.value?.current_price);
    const currentTokenFiatPriceFormatted = computed(
      () => formatCurrency(currentTokenFiatPrice.value),
    );

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
      AETERNITY_SYMBOL,
      totalAmountFormatted,
      isOnline,
      isMiddlewareReady,
      aeOnlyOrNoConnection,
      currentTokenFiatPrice,
      currentTokenFiatPriceFormatted,
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
