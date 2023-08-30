<template>
  <div class="total-amount">
    <span
      v-text="totalAmount"
    />
    <span
      class="label"
      v-text="isMultisig ? $t('common.totalMultisig') : $t('common.total')"
    />
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
  @extend %face-sans-16-bold;

  display: flex;
  align-items: center;
  color: variables.$color-white;
  line-height: 1;

  .label {
    @extend %face-sans-14-medium;

    display: inline-block;
    margin-top: 1px;
    margin-left: 4px;
    line-height: inherit;
    opacity: 0.5;
  }
}
</style>
