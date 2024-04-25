<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardBase
        v-if="isValidActiveIdx"
        class="dashboard-multisig"
        :active-idx="multisigAccountIdx"
        :balances-total="multisigBalancesTotal"
        :accounts="multisigAccounts"
        is-multisig
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
          <OpenTransferReceiveModalButton
            :disabled="isActiveMultisigAccountPending"
            is-multisig
            is-big
          />
          <OpenTransferSendModalButton
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
import { MODAL_TRANSFER_SEND } from '@/constants';
import { useModals, useMultisigAccounts, usePendingMultisigTransaction } from '@/composables';
import { ROUTE_MULTISIG_DETAILS } from '@/popup/router/routeNames';

import AccountCardMultisig from '@/popup/components/AccountCardMultisig.vue';
import AccountSwiper from '@/popup/components/AccountSwiper.vue';
import PendingMultisigTransactionCard from '../components/PendingMultisigTransactionCard.vue';
import DashboardBase from '../components/DashboardBase.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';

import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  name: 'DashboardMultisig',
  components: {
    AccountCardMultisig,
    AccountSwiper,
    OpenTransferSendModalButton,
    OpenTransferReceiveModalButton,
    DashboardBase,
    PendingMultisigTransactionCard,
    IonPage,
    IonContent,
  },
  setup() {
    const { openModal } = useModals();
    const {
      multisigAccounts,
      activeMultisigAccountId,
      pendingMultisigAccounts,
      isActiveMultisigAccountPending,
      setActiveMultisigAccountId,
    } = useMultisigAccounts();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();

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
      isActiveMultisigAccountPending,
      pendingMultisigTransaction,
      isValidActiveIdx,
      ROUTE_MULTISIG_DETAILS,
      ArrowSendIcon,
      addressList,
      multisigAccountIdx,
      multisigAccounts,
      multisigBalancesTotal,
      openTransferSendModal,
      selectAccount,
      isPendingAccount,
    };
  },
});
</script>
