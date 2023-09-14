<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
  >
    <template #top>
      <AccountInfo
        :account="account"
        avatar-borderless
        with-protocol-icon
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
        v-if="account.protocol === PROTOCOL_AETERNITY"
        :current-account="account"
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
import { PROTOCOL_AETERNITY } from '@/constants';
import type { IAccount } from '../../types';
import { ROUTE_ACCOUNT_DETAILS } from '../router/routeNames';
import { useBalances } from '../../composables';

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
  setup() {
    const { balance } = useBalances();

    const numericBalance = computed<number>(() => balance.value.toNumber());

    return {
      ROUTE_ACCOUNT_DETAILS,
      PROTOCOL_AETERNITY,
      numericBalance,
    };
  },
});
</script>
