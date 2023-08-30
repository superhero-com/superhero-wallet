<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardBase
        class="dashboard-multisig"
        :active-idx="multisigAccountIdx"
        :balances-total="multisigBalancesTotal"
      >
        <template #swiper>
          <AccountSwiper
            :active-idx="multisigAccountIdx"
            :address-list="addressList"
            :to="{ name: ROUTE_MULTISIG_DETAILS }"
            is-multisig
            @select-account="(index) => selectAccount(index)"
          >
            <template #slide="{ index }">
              <AccountCardMultisig
                :account="multisigAccounts[index]"
                :selected="index === multisigAccountIdx"
              />
            </template>
          </AccountSwiper>
        </template>

        <template #buttons>
          <OpenTransferReceiveModalButton
            is-multisig
            is-big
          />
          <OpenTransferSendModalButton
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
import { IonPage, IonContent } from '@ionic/vue';
import { computed, defineComponent } from 'vue';
import BigNumber from 'bignumber.js';

import { MODAL_TRANSFER_SEND } from '@/constants';
import { ROUTE_MULTISIG_DETAILS } from '@/popup/router/routeNames';
import { useModals, useMultisigAccounts } from '@/composables';

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
    const {
      multisigAccounts,
      activeMultisigAccountId,
      setActiveMultisigAccountId,
    } = useMultisigAccounts();

    const { openModal } = useModals();

    const addressList = computed(() => multisigAccounts.value.map((acc) => acc.gaAccountId));

    const multisigAccountIdx = computed(
      () => multisigAccounts.value.findIndex(
        (acc) => acc.gaAccountId === activeMultisigAccountId.value,
      ),
    );

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

    return {
      ROUTE_MULTISIG_DETAILS,
      ArrowSendIcon,
      addressList,
      multisigAccountIdx,
      multisigAccounts,
      multisigBalancesTotal,
      openTransferSendModal,
      selectAccount,
    };
  },
});
</script>
