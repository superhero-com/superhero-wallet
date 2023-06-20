<template>
  <Field
    v-slot="{ field, errors }"
    :model-value="modelValue"
    :rules="{
      required: true,
      min_value_exclusive: 0,
      enough_ae: fee.toString(),
      max_value: (max > 0) ? max : undefined,
    }"
    name="amount"
  >
    <InputField
      v-bind="field"
      class="input-amount"
      type="number"
      placeholder="0.00"
      :model-value="modelValue"
      :message="$attrs['message'] || errors[0]"
      :label="$attrs.label as string || $t('common.amount')"
      @update:modelValue="(value)=> handleUpdateModelValue(value, !!errors[0])"
    >
      <template #after>
        <span class="token">{{ AETERNITY_SYMBOL }}</span>
        <span
          class="amount"
          data-cy="amount-currency"
        >
          ({{ currencyAmount }})
        </span>
      </template>
    </InputField>
  </Field>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
} from 'vue';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { Field } from 'vee-validate';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { AETERNITY_SYMBOL, calculateFee } from '../utils';
import { useBalances, useCurrencies, useSdk } from '../../composables';
import InputField from './InputField.vue';

export default defineComponent({
  components: {
    InputField,
    Field,
  },
  props: {
    modelValue: { type: [String, Number], default: '' },
    noToken: Boolean,
  },
  emits: ['update:modelValue', 'error'],
  setup(props, { emit }) {
    const fee = ref(new BigNumber(0));

    const store = useStore();
    const { getSdk } = useSdk({ store });
    const { balance } = useBalances({ store });
    const { getFormattedFiat } = useCurrencies();

    const max = computed(() => balance.value.minus(fee.value).toNumber());

    const currencyAmount = computed(() => getFormattedFiat(+props.modelValue || 0));

    onMounted(async () => {
      const sdk = await getSdk();
      fee.value = calculateFee(SCHEMA.TX_TYPE.spend, sdk.Ae.defaults);
    });

    async function handleUpdateModelValue(value: string, hasError: boolean) {
      nextTick(() => {
        emit('update:modelValue', value);
        emit('error', hasError);
      });
    }

    return {
      AETERNITY_SYMBOL,
      fee,
      max,
      currencyAmount,
      handleUpdateModelValue,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.input-amount {
  white-space: nowrap;

  .token {
    margin-right: 2px;
    font-weight: 500;
    color: variables.$color-primary;
  }

  .amount {
    color: variables.$color-grey-dark;
  }
}
</style>
