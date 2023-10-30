<template>
  <IonPage>
    <IonContent class="account-ion-content">
      <AccountDetailsBase class="account-details" />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    IonPage,
    IonContent,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';

.account-ion-content {
  overflow: hidden;
  background-color: variables.$color-bg-4;
}
</style>
