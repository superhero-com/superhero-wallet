<template>
  <div class="dashboard-header">
    <TotalWalletAmount
      v-if="accounts.length > 1"
      :total-balance="balancesTotal"
    />

    <AccountSwiper
      :active-idx="activeIdx"
      :address-list="addressList"
      :to="{ name: ROUTE_ACCOUNT_DETAILS }"
      @selectAccount="(index) => selectAccount(index)"
    >
      <template #slide="{ index }">
        <AccountCard
          :account="accounts[index]"
          :selected="index === activeIdx"
        />
      </template>
    </AccountSwiper>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import { useStore } from 'vuex';
import { useGetter, useState } from '../../composables/vuex';
import type { IAccount } from '../../types';

import AccountCard from './AccountCard.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import AccountSwiper from './AccountSwiper.vue';
import { useBalances } from '../../composables';
import { ROUTE_ACCOUNT_DETAILS } from '../router/routeNames';

export default defineComponent({
  components: {
    AccountSwiper,
    TotalWalletAmount,
    AccountCard,
  },
  setup(props) {
    const store = useStore();

    const { balancesTotal } = useBalances({ store });

    const activeIdx = useState<number>('accounts', 'activeIdx');
    const accounts = useGetter<IAccount[]>('accounts');

    const addressList = computed(() => accounts.value.map((acc) => acc.address));

    function selectAccount(index: number) {
      store.commit('accounts/setActiveIdx', +(accounts.value[index].idx || 0));
    }

    return {
      accounts,
      activeIdx,
      addressList,
      balancesTotal,
      ROUTE_ACCOUNT_DETAILS,
      selectAccount,
    };
  },
});
</script>
