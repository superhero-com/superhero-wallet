<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <AccountDetailsBase v-if="activeMultisigAccount">
        <template #account-info>
          <AccountInfo
            :address="activeMultisigAccount.gaAccountId"
            is-multisig
            can-copy-address
          />
        </template>

        <template #balance>
          <BalanceInfo :balance="+(activeMultisigAccount.balance || 0)" />
        </template>

        <template #buttons>
          <OpenTransferReceiveModalButton is-multisig />
          <OpenTransferSendModalButton is-multisig />
          <BtnBox
            v-if="!IS_IOS"
            :icon="CreditCardIcon"
            :text="$t('common.buy')"
            :href="simplexLink"
          />
        </template>

        <template #navigation>
          <AccountDetailsNavigation is-multisig />
        </template>
      </AccountDetailsBase>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useMultisigAccounts } from '../../composables';
import { buildSimplexLink } from '../utils';
import { IS_IOS } from '../../lib/environment';

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
    const store = useStore();
    const { activeMultisigAccount } = useMultisigAccounts({ store });

    const simplexLink = computed(
      () => (activeMultisigAccount.value)
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    return {
      activeMultisigAccount,
      simplexLink,
      CreditCardIcon,
      IS_IOS,
    };
  },
});
</script>
