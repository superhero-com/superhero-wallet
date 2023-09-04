<template>
  <ion-page>
    <ion-content class="account-ion-content">
      <AccountDetailsBase class="account-details" />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import { ROUTE_ACCOUNT_DETAILS_TRANSACTIONS } from '@/popup/router/routeNames';
import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    IonPage,
    IonContent,
  },

  setup() {
    const route = useRoute();
    const router = useRouter();

    (() => {
      // BTC have only one view (transaction list) in ACCOUNT DETAILS
      if (route.name !== ROUTE_ACCOUNT_DETAILS_TRANSACTIONS) {
        router.push({ name: ROUTE_ACCOUNT_DETAILS_TRANSACTIONS });
      }
    })();
  },
});
</script>
<style scoped>
  .account-ion-content {
    overflow: hidden;
    background-color: #191919;
  }
</style>
