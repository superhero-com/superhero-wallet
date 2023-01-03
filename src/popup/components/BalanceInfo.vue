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
import { IAccount } from '../../types';
import { useBalances } from '../../composables';
import { useGetter, useState } from '../../composables/vuex';
import AeBalance from './AeBalance.vue';

export default defineComponent({
  components: {
    AeBalance,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  setup(props, { root }) {
    const { balances } = useBalances({ store: root.$store });

    const activeIdx = useState<number>('accounts', 'activeIdx');
    const accounts = useGetter<IAccount[]>('accounts');
    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const idx = computed(() => props.accountIdx === -1 ? activeIdx.value : props.accountIdx);
    const balance = computed(
      () => balances.value[accounts.value[idx.value].address]?.toNumber() || 0,
    );
    const currencyFormatted = computed(() => convertToCurrencyFormatted.value(balance.value));

    return {
      balances,
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
