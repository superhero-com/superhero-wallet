<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
  >
    <template #top>
      <AccountInfo
        :address="account.address"
        :name="account.name"
        :idx="account.idx"
        avatar-borderless
      />
    </template>

    <template #middle>
      <BalanceInfo :balance="numericBalance" />
    </template>

    <template #bottom>
      <AccountCardTotalTokens
        :current-account="account"
        :selected="selected"
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
import { useStore } from 'vuex';
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
    const store = useStore();

    const { balance } = useBalances({ store });

    const numericBalance = computed<number>(() => balance.value.toNumber());

    return {
      numericBalance,
      ROUTE_ACCOUNT_DETAILS,
    };
  },
});
</script>
