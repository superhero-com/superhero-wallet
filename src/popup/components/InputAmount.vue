<template>
  <InputField
    v-bind="$attrs"
    name="amount"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :model-value="modelValue"
    :message="$attrs['message'] || errors[0]"
    :label="$attrs.label as string || $t('common.amount')"
    @update:modelValue="$emit('update:modelValue', $event)"
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
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useField } from 'vee-validate';
import { AETERNITY_SYMBOL, calculateFee } from '../utils';
import { useBalances, useCurrencies, useSdk } from '../../composables';
import InputField from './InputField.vue';

export default defineComponent({
  components: {
    InputField,
  },
  props: {
    modelValue: { type: [String, Number], default: '' },
    noToken: Boolean,
  },
  emits: ['update:modelValue', 'error'],
  compatConfig: { COMPONENT_V_MODEL: false },
  setup(props, { emit }) {
    const fee = ref(new BigNumber(0));

    const store = useStore();
    const { getSdk } = useSdk({ store });
    const { balance } = useBalances({ store });
    const { getFormattedFiat } = useCurrencies();

    const max = computed(() => balance.value.minus(fee.value).toNumber());

    const { errors } = useField('amount', {
      required: true,
      min_value_exclusive: 0,
      enough_ae: fee.toString(),
      max_value: (max.value > 0) ? max : undefined,
    });

    const hasError = computed(() => errors.value.length > 0);
    const currencyAmount = computed(() => getFormattedFiat(+props.modelValue || 0));

    onMounted(async () => {
      const sdk = await getSdk();
      fee.value = calculateFee(SCHEMA.TX_TYPE.spend, sdk.Ae.defaults);
    });

    watch(hasError, (val) => emit('error', val));

    return {
      AETERNITY_SYMBOL,
      fee,
      max,
      currencyAmount,
      errors,
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
