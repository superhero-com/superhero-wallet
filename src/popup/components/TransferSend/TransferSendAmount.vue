<template>
  <div
    class="transfer-send-amount"
  >
    <Field
      v-slot="{ field }"
      ref="amountField"
      name="amount"
      :model-value="modelValue"
      :validate-on-mount="!!modelValue"
      :rules="{
        required: true,
        min_value_exclusive: 0,
        ...validationRules,
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
        :selected-asset="selectedAsset"
        @update:modelValue="$emit('update:modelValue', $event)"
        @asset-selected="(asset) => $emit('assetSelected', asset)"
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
import type { Protocol } from '@/types';
import InputAmount from '@/popup/components/InputAmount.vue';
import { getMessageByFieldName } from '@/utils';

export default defineComponent({
  components: {
    InputAmount,
    Field,
  },
  props: {
    modelValue: { type: String, default: '' },
    validationRules: { type: Object, default: () => {} },
    selectedAsset: { type: Object, default: () => {} },
    errors: { type: Object, required: true },
    customLabel: { type: String, default: '' },
    readonly: Boolean,
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  emits: ['update:modelValue', 'asset-selected'],
  setup(props) {
    const amountMessage = computed(() => getMessageByFieldName(props.errors.amount));

    return {
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
}
</style>
