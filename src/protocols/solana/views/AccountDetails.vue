<template>
  <IonPage>
    <IonContent class="account-ion-content">
      <AccountDetailsBase
        v-if="pageDidEnter"
        class="account-details"
      >
        <template #navigation>
          <AccountDetailsNavigation
            :route-names="[
              ROUTE_ACCOUNT_DETAILS,
              ROUTE_ACCOUNT_DETAILS_ASSETS,
            ]"
          />
        </template>
      </AccountDetailsBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import { ROUTE_ACCOUNT_DETAILS, ROUTE_ACCOUNT_DETAILS_ASSETS } from '@/popup/router/routeNames';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    IonPage,
    IonContent,
    AccountDetailsNavigation,
  },
  props: {
    pageDidEnter: Boolean,
  },
  setup() {
    return {
      ROUTE_ACCOUNT_DETAILS,
      ROUTE_ACCOUNT_DETAILS_ASSETS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.account-ion-content {
  overflow: hidden;
  background-color: $color-bg-4;
}
</style>
