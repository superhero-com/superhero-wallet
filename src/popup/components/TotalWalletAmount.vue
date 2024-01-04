<template>
  <div class="total-amount">
    <span>{{ totalAmount }}</span>
    <span
      class="label"
    >
      {{ isMultisig ? $t('common.totalMultisig') : $t('common.total') }}
    </span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useCurrencies } from '@/composables';

export default defineComponent({
  props: {
    totalBalance: { type: String, default: '0' },
    isMultisig: Boolean,
  },
  setup(props) {
    const { formatCurrency } = useCurrencies();

    const totalAmount = computed(
      () => formatCurrency(+props.totalBalance),
    );

    return {
      totalAmount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables';

.total-amount {
  color: variables.$color-white;
  // line-height: 18px;

  .label {
    margin-left: 4px;
    // line-height: 18px;
    opacity: 0.5;
  }
}
</style>
