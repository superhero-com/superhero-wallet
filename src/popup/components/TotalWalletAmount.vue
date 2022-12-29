<template>
  <div class="total-amount">
    <span>{{ totalAmount }}</span>
    <span class="label">
      {{ $t('total') }}
    </span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { useGetter } from '../../composables';
import { rxJsObservableToVueState } from '../utils';

export default defineComponent({
  setup(props, { root }) {
    const balances = rxJsObservableToVueState<BigNumber[]>(
      (root.$store.state as any).observables.balances,
    );

    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const totalAmount = computed(() => {
      if (!balances.value?.length) return 0;
      const total = balances.value.reduce(
        (previousValue, currentValue) => previousValue.plus(currentValue),
        new BigNumber(0),
      );
      return convertToCurrencyFormatted.value(total);
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
