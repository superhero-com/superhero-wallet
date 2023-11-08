<template>
  <IonPage>
    <AccountDetailsTransactionsBase
      :ionic-lifecycle-status="ionicLifecycleStatus"
      :address="activeAccount.address"
    />
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { IonPage } from '@ionic/vue';

import type { IonicLifecycleStatus } from '@/types';
import { useAccounts } from '@/composables';

import AccountDetailsTransactionsBase from '@/popup/components/AccountDetailsTransactionsBase.vue';

export default defineComponent({
  components: {
    IonPage,
    AccountDetailsTransactionsBase,
  },
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup() {
    const { activeAccount } = useAccounts();

    return {
      activeAccount,
    };
  },
});
</script>
