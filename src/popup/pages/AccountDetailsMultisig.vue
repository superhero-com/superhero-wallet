<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <AccountDetailsBase
        v-if="activeMultisigAccount && isPageActive"
        without-default-buttons
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
          <AccountDetailsNavigation is-multisig />
        </template>
      </AccountDetailsBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  IonContent,
  IonPage,
  onIonViewDidEnter,
  onIonViewDidLeave,
} from '@ionic/vue';
import { computed, defineComponent, ref } from 'vue';
import { PROTOCOLS, UNFINISHED_FEATURES } from '@/constants';
import { useMultisigAccounts } from '@/composables';
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
  setup() {
    const isPageActive = ref(false);

    const { activeMultisigAccount } = useMultisigAccounts();

    const simplexLink = computed(
      () => (activeMultisigAccount.value)
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    onIonViewDidEnter(() => {
      isPageActive.value = true;
    });

    onIonViewDidLeave(() => {
      isPageActive.value = false;
    });

    return {
      UNFINISHED_FEATURES,
      PROTOCOLS,
      activeMultisigAccount,
      isPageActive,
      simplexLink,
      CreditCardIcon,
      convertMultisigAccountToAccount,
    };
  },
});
</script>
