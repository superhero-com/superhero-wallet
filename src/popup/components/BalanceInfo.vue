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
import { useBalances, useMultisigAccounts } from '../../composables';
import { useGetter } from '../../composables/vuex';
import { convertToken, MAGNITUDE } from '../utils';
import AeBalance from './AeBalance.vue';

export default defineComponent({
  components: {
    AeBalance,
  },
  props: {
    account: { type: Object, default: null },
  },
  setup(props, { root }) {
    const { balances } = useBalances({ store: root.$store });
    const { isMultisigDashboard } = useMultisigAccounts({ store: root.$store });

    const account = useGetter<IAccount>('account');
    const convertToCurrencyFormatted = useGetter('convertToCurrencyFormatted');

    const currentAccount = computed(() => props.account || account.value);

    const balance = computed(
      () => (isMultisigDashboard.value
        ? convertToken(currentAccount.value.balance, -MAGNITUDE)
        : balances.value[currentAccount.value.address])?.toNumber() || 0,
    );

    const currencyFormatted = computed(
      () => convertToCurrencyFormatted.value(balance.value),
    );

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
