<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
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

    <template #bottom>
      <AccountCardTotalTokens
        :account="account"
      />
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
import AccountCardBase from './AccountCardBase.vue';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
    selected: Boolean,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();

    const numericBalance = computed(() => getAccountBalance(props.account.address).toNumber());

    return {
      numericBalance,
    };
  },
});
</script>
