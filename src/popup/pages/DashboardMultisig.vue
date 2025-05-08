<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardBase
        v-if="isValidActiveIdx"
        class="dashboard-multisig"
        :accounts="multisigAccounts"
        :accounts-select-options="multisigAccountsSelectOptions"
        :active-account-address="activeMultisigAccount?.gaAccountId"
        :active-idx="multisigAccountIdx"
        :balances-total="multisigBalancesTotal"
        :force-header="accounts.length > 1"
        is-multisig
        @select-account="(address) => setActiveMultisigAccountId(address)"
      >
        <template #swiper>
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
        </template>

        <template #buttons>
          <OpenTransferReceiveModalBtn
            :disabled="isActiveMultisigAccountPending"
            is-multisig
            is-big
          />
          <OpenTransferSendModalBtn
            :disabled="!!pendingMultisigTransaction || isActiveMultisigAccountPending"
            is-multisig
            is-big
          />
        </template>

        <template #widgets>
          <PendingMultisigTransactionCard />
        </template>
      </DashboardBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  IonPage,
  IonContent,
} from '@ionic/vue';
import { computed, defineComponent } from 'vue';
import BigNumber from 'bignumber.js';

import type { IMultisigAccount } from '@/types';
import { MODAL_TRANSFER_SEND, PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useCurrencies,
  useModals,
  useMultisigAccounts,
  usePendingMultisigTransaction,
} from '@/composables';
import { ROUTE_MULTISIG_DETAILS } from '@/popup/router/routeNames';

import AccountCardMultisig from '@/popup/components/AccountCardMultisig.vue';
import AccountSwiper from '@/popup/components/AccountSwiper.vue';
import PendingMultisigTransactionCard from '@/popup/components/PendingMultisigTransactionCard.vue';
import DashboardBase from '@/popup/components/DashboardBase.vue';
import OpenTransferReceiveModalBtn from '@/popup/components/OpenTransferReceiveModalBtn.vue';
import OpenTransferSendModalBtn from '@/popup/components/OpenTransferSendModalBtn.vue';

import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';

export default defineComponent({
  name: 'DashboardMultisig',
  components: {
    AccountCardMultisig,
    AccountSwiper,
    OpenTransferSendModalBtn,
    OpenTransferReceiveModalBtn,
    DashboardBase,
    PendingMultisigTransactionCard,
    IonPage,
    IonContent,
  },
  setup() {
    const { openModal } = useModals();
    const {
      activeMultisigAccount,
      multisigAccounts,
      multisigAccountsSelectOptions,
      activeMultisigAccountId,
      pendingMultisigAccounts,
      isActiveMultisigAccountPending,
      setActiveMultisigAccountId,
    } = useMultisigAccounts();
    const { accounts } = useAccounts();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();
    const { getCurrentCurrencyRate } = useCurrencies();

    const addressList = computed(() => multisigAccounts.value.map((acc) => acc.gaAccountId));

    const multisigAccountIdx = computed(
      () => multisigAccounts.value.findIndex(
        (acc) => acc.gaAccountId === activeMultisigAccountId.value,
      ),
    );

    const isValidActiveIdx = computed(() => multisigAccountIdx.value >= 0);

    const multisigBalancesTotal = computed(
      () => multisigAccounts.value
        .map((acc) => acc.balance)
        .reduce((total, balance) => total.plus(balance), new BigNumber(0))
        .multipliedBy(getCurrentCurrencyRate(PROTOCOLS.aeternity))
        .toFixed(),
    );

    function selectAccount(index: number) {
      const selectedAccount = multisigAccounts.value[index];
      if (selectedAccount.gaAccountId) {
        setActiveMultisigAccountId(selectedAccount.gaAccountId);
      }
    }

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: true,
      });
    }

    function isPendingAccount(account: IMultisigAccount): boolean {
      return !!pendingMultisigAccounts.value.find(
        ({ gaAccountId }) => gaAccountId === account.gaAccountId,
      );
    }

    return {
      activeMultisigAccount,
      isActiveMultisigAccountPending,
      pendingMultisigTransaction,
      isValidActiveIdx,
      ROUTE_MULTISIG_DETAILS,
      ArrowSendIcon,
      addressList,
      accounts,
      multisigAccountIdx,
      multisigAccounts,
      multisigAccountsSelectOptions,
      multisigBalancesTotal,
      openTransferSendModal,
      selectAccount,
      isPendingAccount,
      setActiveMultisigAccountId,
    };
  },
});
</script>
