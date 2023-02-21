<template>
  <div class="total-amount">
    <span>{{ totalAmount }}</span>
    <span
      class="label"
    >
      {{ isMultisig ? $t('totalMultisig') : $t('total') }}
    </span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { useGetter } from '../../composables/vuex';

export default defineComponent({
  props: {
    totalBalance: { type: Array as PropType<BigNumber[]>, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const totalAmount = computed(() => {
      const total = props.totalBalance.reduce(
        (previousValue, currentValue) => previousValue.plus(currentValue),
        new BigNumber(0),
      );
      return convertToCurrencyFormatted.value(total.toNumber());
    });

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

  color: variables.$color-white;
  line-height: 18px;
  margin-bottom: 12px;
  margin-left: 24px;

  .label {
    @extend %face-sans-14-medium;

    margin-left: 6px;
    line-height: 18px;
    opacity: 0.5;
  }
}
</style>
