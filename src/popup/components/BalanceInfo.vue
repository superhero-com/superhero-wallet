<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <AeBalance :balance="balance" />
    <div class="display-value">
      {{ currencyFormatted }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { useGetter, useState } from '../../composables';
import { rxJsObservableToVueState } from '../utils';
import AeBalance from './AeBalance.vue';

export default defineComponent({
  components: {
    AeBalance,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  setup(props, { root }) {
    const activeIdx = useState('accounts', 'activeIdx');
    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const balances = rxJsObservableToVueState<BigNumber[]>(
      (root.$store.state as any).observables.balances,
    );

    const idx = computed(() => props.accountIdx === -1 ? activeIdx.value : props.accountIdx);
    const balance = computed(() => balances.value[idx.value].toNumber());
    const currencyFormatted = computed(() => convertToCurrencyFormatted.value(balance.value));

    return {
      balance,
      currencyFormatted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.balance-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;

  .display-value {
    @extend %face-sans-16-regular;

    color: rgba(variables.$color-white, 1);
    line-height: 18px;
    margin-top: 2px;
    opacity: 0.75;
  }
}
</style>
