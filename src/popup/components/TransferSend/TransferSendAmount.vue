<template>
  <div
    class="transfer-send-amount"
    :class="{
      'without-margin': withoutMargin,
    }"
  >
    <Field
      v-slot="{ field }"
      ref="amountField"
      name="amount"
      :model-value="modelValue"
      :validate-on-mount="!!modelValue"
      :rules="{
        required: true,
        ...validationRules,
        min_value_exclusive: 0,
        does_not_exceed_decimals: assetDecimals,
      }"
    >
      <InputAmount
        v-bind="field"
        :model-value="modelValue"
        name="amount"
        data-cy="amount"
        class="amount-input"
        show-tokens-with-balance
        :label="customLabel || $t('common.amount')"
        :message="amountMessage"
        :protocol="protocol"
        :readonly="readonly"
        :blink-on-change="blinkOnChange"
        :selected-asset="(selectedAsset as IAsset)"
        @update:modelValue="$emit('update:modelValue', $event)"
        @asset-selected="(asset) => $emit('asset-selected', asset)"
      >
        <template #label-after>
          <slot name="label-after" />
        </template>
      </InputAmount>
    </Field>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { Field } from 'vee-validate';

import type { Protocol, IAsset } from '@/types';
import { getMessageByFieldName } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import InputAmount from '@/popup/components/InputAmount.vue';

export default defineComponent({
  components: {
    InputAmount,
    Field,
  },
  props: {
    modelValue: { type: String, default: '' },
    validationRules: { type: Object, default: () => {} },
    selectedAsset: { type: Object as PropType<IAsset>, default: () => {} },
    errors: { type: Object, required: true },
    customLabel: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
    readonly: Boolean,
    withoutMargin: Boolean,
    blinkOnChange: Boolean,
  },
  emits: ['update:modelValue', 'asset-selected'],
  setup(props) {
    const amountMessage = computed(() => getMessageByFieldName(props.errors.amount));

    const assetDecimals = computed(() => (
      props.selectedAsset?.decimals
      ?? ProtocolAdapterFactory.getAdapter(props.protocol).coinPrecision
    ));

    return {
      assetDecimals,
      amountMessage,
    };
  },
});
</script>

<style lang="scss" scoped>
.transfer-send-amount {
  .amount-input {
    margin-bottom: 22px;
  }

  &.without-margin {
    .amount-input {
      margin-bottom: 0;
    }
  }
}
</style>
