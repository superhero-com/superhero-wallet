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
import { useBalances } from '../../composables';
import { useGetter } from '../../composables/vuex';

export default defineComponent({
  setup(props, { root }) {
    const { balances } = useBalances({ store: root.$store });

    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const totalAmount = computed(() => {
      const total = Object.values(balances.value).reduce(
        (previousValue, currentValue) => previousValue.plus(currentValue),
        new BigNumber(0),
      );
      return convertToCurrencyFormatted.value(total.toNumber());
    });

    return {
      balances,
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
