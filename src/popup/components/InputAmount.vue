<template>
  <InputField
    v-bind="$attrs"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :model-value="modelValue"
    :label="label"
    :message="$attrs.message"
    :blink-on-change="blinkOnChange"
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
        v-if="!readonly"
        v-bind="$attrs"
        data-cy="select-asset"
        :value="currentAsset"
        :focused="focused"
        :with-balance-only="withBalanceOnly"
        @select-asset="handleAssetSelected($event)"
      />
      <div
        v-else
        class="readonly-symbol"
        v-text="defaultCoin.symbol"
      />
    </template>

    <template #under="{ focused }">
      <div
        class="input-amount-desc"
        :class="{ focused }"
      >
        <span
          v-if="currentAsset.price"
          class="input-amount-desc-total"
          data-cy="total-amount-currency"
        >
          <span v-if="modelValue">&thickapprox;</span>
          {{ totalAmountFormatted }}
        </span>

        <span
          v-if="currentAsset.price"
          class="input-amount-desc-at"
        >
          @{{
            (currentAsset.price)
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
import { useBalances, useCurrencies } from '@/composables';
import type { IAsset, Protocol } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

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
    selectedAsset: { type: Object as PropType<IAsset>, default: null },
    protocol: { type: String as PropType<Protocol>, required: true },
    readonly: Boolean,
    withBalanceOnly: Boolean,
    blinkOnChange: Boolean,
  },
  emits: ['update:modelValue', 'asset-selected'],
  setup(props, { emit }) {
    const {
      getFormattedAndRoundedFiat,
      marketData,
    } = useCurrencies();
    const { balance } = useBalances();

    const defaultCoin = computed(() => ProtocolAdapterFactory
      .getAdapter(props.protocol)
      .getDefaultCoin(marketData.value!, +balance.value));

    const currentAsset = computed((): IAsset => props.selectedAsset || defaultCoin.value);

    const currentAssetFiatPriceFormatted = computed(
      () => getFormattedAndRoundedFiat(currentAsset.value.price, props.protocol),
    );
    const totalAmountFormatted = computed(() => getFormattedAndRoundedFiat(
      +props.modelValue * currentAsset.value.price,
      props.protocol,
    ));

    function handleAssetSelected(asset: IAsset) {
      emit('asset-selected', asset);
    }

    onMounted(() => {
      if (!props.selectedAsset) {
        handleAssetSelected(defaultCoin.value);
      }
    });

    return {
      defaultCoin,
      totalAmountFormatted,
      currentAssetFiatPriceFormatted,
      currentAsset,
      handleAssetSelected,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.input-amount {
  &-desc {
    @include mixins.flex(space-between, center);

    user-select: none;

    &-total {
      word-break: break-word;

      .focused & {
        color: rgba($color-white, 0.75);
      }
    }

    &-at {
      margin-left: auto;
    }
  }

  &-asset {
    margin-right: -2px; // Compensate visually the roundness of the input
  }

  .readonly-symbol {
    @extend %face-sans-15-medium;

    white-space: nowrap;
    color: $color-primary;
    user-select: none;
  }
}
</style>
