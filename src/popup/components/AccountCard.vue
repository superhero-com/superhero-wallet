<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
    :address="account.address"
  >
    <template #top>
      <AccountInfo
        :account="account"
        avatar-borderless
        show-protocol-icon
      />
    </template>

    <template #middle>
      <BalanceInfo
        :balance="numericBalance"
        :protocol="account.protocol"
      />
    </template>

    <template #bottom-left>
      <AccountCardTotalTokens :account="account" />
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { IAccount } from '@/types';
import { useBalances } from '@/composables';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardTotalTokens from './AccountCardTotalTokens.vue';
import AccountCardBase, { accountCardBaseCommonProps } from './AccountCardBase.vue';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
    ...accountCardBaseCommonProps,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();

    const numericBalance = computed(() => (
      getAccountBalance(props.account.protocol, props.account.address).toNumber()));

    return {
      numericBalance,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-card-base {
  .account-type-icon {
    width: 20px;
    height: 20px;
    opacity: 0.85;
  }
}
</style>
