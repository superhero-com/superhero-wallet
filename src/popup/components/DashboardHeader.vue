<template>
  <div class="dashboard-header">
    <TotalWalletAmount
      v-if="accounts.length > 1"
      :total-balance="accountsTotalBalance"
    />

    <AccountSwiper
      :active-idx="activeAccountGlobalIdx"
      :address-list="accountsAddressList"
      :to="{ name: ROUTE_ACCOUNT_DETAILS }"
      @selectAccount="(index) => setActiveAccountByGlobalIdx(index)"
    >
      <template #slide="{ index }">
        <AccountCard
          :account="accounts[index]"
          :selected="index === activeAccountGlobalIdx"
        />
      </template>
    </AccountSwiper>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useAccounts, useBalances } from '@/composables';
import { ROUTE_ACCOUNT_DETAILS } from '@/popup/router/routeNames';

import AccountCard from './AccountCard.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import AccountSwiper from './AccountSwiper.vue';

export default defineComponent({
  components: {
    AccountSwiper,
    TotalWalletAmount,
    AccountCard,
  },
  setup() {
    const store = useStore();
    const {
      accounts,
      accountsAddressList,
      activeAccountGlobalIdx,
      setActiveAccountByGlobalIdx,
    } = useAccounts({ store });

    const { accountsTotalBalance } = useBalances({ store });

    return {
      ROUTE_ACCOUNT_DETAILS,
      accounts,
      accountsAddressList,
      accountsTotalBalance,
      activeAccountGlobalIdx,
      setActiveAccountByGlobalIdx,
    };
  },
});
</script>
