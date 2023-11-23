<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <AccountDetailsBase
        v-if="activeMultisigAccount"
        without-default-buttons
        :ionic-lifecycle-status="ionicLifecycleStatus"
      >
        <template #account-info>
          <AccountInfo
            :account="convertMultisigAccountToAccount(activeMultisigAccount)"
            is-multisig
            show-protocol-icon
            can-copy-address
          />
        </template>

        <template #balance>
          <BalanceInfo
            :balance="+(activeMultisigAccount.balance || 0)"
            :protocol="PROTOCOLS.aeternity"
          />
        </template>

        <template #buttons>
          <OpenTransferReceiveModalButton is-multisig />
          <OpenTransferSendModalButton is-multisig />
          <BtnBox
            v-if="UNFINISHED_FEATURES"
            :icon="CreditCardIcon"
            :text="$t('common.buy')"
            :href="simplexLink"
          />
        </template>

        <template #navigation>
          <AccountDetailsNavigation
            :route-names="[
              ROUTE_MULTISIG_DETAILS,
              ROUTE_MULTISIG_DETAILS_INFO,
              ROUTE_MULTISIG_DETAILS_ASSETS,
            ]"
          />
        </template>
      </AccountDetailsBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { PropType, computed, defineComponent } from 'vue';
import { IonicLifecycleStatus } from '@/types';
import { PROTOCOLS, UNFINISHED_FEATURES } from '@/constants';
import { useMultisigAccounts } from '@/composables';
import {
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_ASSETS,
  ROUTE_MULTISIG_DETAILS_INFO,
} from '@/popup/router/routeNames';
import { buildSimplexLink, convertMultisigAccountToAccount } from '@/protocols/aeternity/helpers';

import BtnBox from '../components/buttons/BtnBox.vue';
import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';

export default defineComponent({
  components: {
    OpenTransferSendModalButton,
    BtnBox,
    OpenTransferReceiveModalButton,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
    AccountDetailsBase,
    IonPage,
    IonContent,
  },
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup() {
    const { activeMultisigAccount } = useMultisigAccounts();

    const simplexLink = computed(
      () => (activeMultisigAccount.value)
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    return {
      UNFINISHED_FEATURES,
      PROTOCOLS,
      ROUTE_MULTISIG_DETAILS,
      ROUTE_MULTISIG_DETAILS_INFO,
      ROUTE_MULTISIG_DETAILS_ASSETS,
      activeMultisigAccount,
      simplexLink,
      CreditCardIcon,
      convertMultisigAccountToAccount,
    };
  },
});
</script>
