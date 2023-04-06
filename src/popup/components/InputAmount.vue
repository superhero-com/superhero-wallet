<template>
  <InputField
    v-validate="{
      required: true,
      min_value_exclusive: 0,
      enough_ae: fee.toString(),
      max_value: (max > 0) ? max : undefined,
    }"
    v-bind="$attrs"
    name="amount"
    class="input-amount"
    type="number"
    placeholder="0.00"
    :value="value"
    :message="$attrs['message'] || errors.first('amount')"
    :label="$attrs.label || $t('common.amount')"
    @input="$emit('input', $event)"
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
  getCurrentInstance,
  onMounted,
  ref,
  watch,
} from 'vue';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { AETERNITY_SYMBOL, calculateFee } from '../utils';
import { useBalances, useCurrencies, useSdk } from '../../composables';
import InputField from './InputField.vue';

export default defineComponent({
  components: {
    InputField,
  },
  props: {
    value: { type: [String, Number], default: '' },
    noToken: Boolean,
  },
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();

    const { getSdk } = useSdk({ store });
    const { balance } = useBalances({ store });
    const { getFormattedFiat } = useCurrencies();

    const fee = ref(new BigNumber(0));

    const hasError = computed(() => (root as any).$validator.errors.has('amount'));
    const max = computed(() => balance.value.minus(fee.value).toNumber());
    const currencyAmount = computed(() => getFormattedFiat(+props.value || 0));

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
