<template>
  <IonPage>
    <AccountDetailsTransactionsBase
      v-bind="$attrs"
      :address="activeMultisigAccount.gaAccountId"
      :additional-transactions="pendingMultisigTransaction"
      :ionic-lifecycle-status="ionicLifecycleStatus"
      is-multisig
    />
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import type { IonicLifecycleStatus } from '@/types';
import { useMultisigAccounts, usePendingMultisigTransaction } from '@/composables';

import AccountDetailsTransactionsBase from '@/popup/components/AccountDetailsTransactionsBase.vue';

export default defineComponent({
  components: {
    IonPage,
    AccountDetailsTransactionsBase,
  },
  setup() {
    const ionicLifecycleStatus = ref<IonicLifecycleStatus>();

    const store = useStore();
    const { activeMultisigAccount } = useMultisigAccounts({ store });
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

    onIonViewDidEnter(() => {
      ionicLifecycleStatus.value = 'didEnter';
    });

    onIonViewDidLeave(() => {
      ionicLifecycleStatus.value = 'didLeave';
    });

    return {
      activeMultisigAccount,
      ionicLifecycleStatus,
      pendingMultisigTransaction,
    };
  },
});
</script>
