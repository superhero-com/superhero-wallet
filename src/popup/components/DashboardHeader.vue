<template>
  <div class="dashboard-header">
    <TotalWalletAmount
      v-if="accounts.length > 1"
      :total-balance="totalBalance"
    />

    <AccountSwiper
      :active-idx="activeIdx"
      :address-list="addressList"
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
} from '@vue/composition-api';
import { useGetter, useState } from '../../composables/vuex';
import type { IAccount } from '../../types';

import AccountCard from './AccountCard.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import AccountSwiper from './AccountSwiper.vue';
import { useBalances } from '../../composables';

export default defineComponent({
  components: {
    AccountSwiper,
    TotalWalletAmount,
    AccountCard,
  },
  setup(props, { root }) {
    const { balances } = useBalances({ store: root.$store });

    const activeIdx = useState<number>('accounts', 'activeIdx');
    const accounts = useGetter<IAccount[]>('accounts');

    const addressList = computed(() => accounts.value.map((acc) => acc.address));
    const totalBalance = computed(() => Object.values(balances.value));

    function selectAccount(index: number) {
      root.$store.commit('accounts/setActiveIdx', +(accounts.value[index].idx || 0));
    }

    return {
      accounts,
      activeIdx,
      addressList,
      totalBalance,
      selectAccount,
    };
  },
});
</script>
