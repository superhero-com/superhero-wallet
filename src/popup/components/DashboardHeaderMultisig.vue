<template>
  <div class="dashboard-header-multisig">
    <TotalWalletAmount
      v-if="addressList.length > 1"
      :total-balance="multisigBalancesTotal"
      is-multisig
    />

    <AccountSwiper
      :active-idx="multisigAccountIdx"
      :address-list="addressList"
      is-multisig
      @select-account="(index) => selectAccount(index)"
    >
      <template #slide="{ index, selected }">
        <AccountCardMultisig
          :account="multisigAccounts[index]"
          :pending="isPendingAccount(multisigAccounts[index])"
          :selected="selected"
          :idx="index"
          :to="{ name: ROUTE_MULTISIG_DETAILS }"
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
import BigNumber from 'bignumber.js';

import type { IMultisigAccount } from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  useCurrencies,
  useMultisigAccounts,
} from '@/composables';
import { ROUTE_MULTISIG_DETAILS } from '../router/routeNames';

import TotalWalletAmount from './TotalWalletAmount.vue';
import AccountSwiper from './AccountSwiper.vue';
import AccountCardMultisig from './AccountCardMultisig.vue';

export default defineComponent({
  components: {
    AccountCardMultisig,
    AccountSwiper,
    TotalWalletAmount,
  },
  setup() {
    const {
      multisigAccounts,
      activeMultisigAccountId,
      pendingMultisigAccounts,
      setActiveMultisigAccountId,
    } = useMultisigAccounts();
    const { getFiat } = useCurrencies();

    const addressList = computed(() => multisigAccounts.value.map((acc) => acc.gaAccountId));

    const multisigAccountIdx = computed(
      () => multisigAccounts.value.findIndex(
        (acc) => acc.gaAccountId === activeMultisigAccountId.value,
      ),
    );

    const multisigBalancesTotal = computed(
      () => {
        const totalBalance = multisigAccounts.value
          .map((acc) => acc.balance)
          .reduce((total, balance) => total.plus(balance), new BigNumber(0))
          .toFixed();

        return getFiat(+totalBalance, PROTOCOLS.aeternity).toString();
      },
    );

    function selectAccount(index: number) {
      const selectedAccount = multisigAccounts.value[index];
      if (selectedAccount.gaAccountId) {
        setActiveMultisigAccountId(selectedAccount.gaAccountId);
      }
    }

    function isPendingAccount(account: IMultisigAccount): boolean {
      return !!pendingMultisigAccounts.value.find(
        ({ gaAccountId }) => gaAccountId === account.gaAccountId,
      );
    }

    return {
      ROUTE_MULTISIG_DETAILS,
      multisigAccounts,
      multisigAccountIdx,
      multisigBalancesTotal,
      addressList,
      selectAccount,
      isPendingAccount,
    };
  },
});
</script>
