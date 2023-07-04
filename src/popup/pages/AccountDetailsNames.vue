<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="account-details-names">
        <ion-router-outlet
          v-if="isOnline"
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.namesNotAvailable')"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonRouterOutlet, IonPage, IonContent } from '@ionic/vue';
import { defineComponent } from 'vue';
import { useConnection } from '../../composables';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    IonPage,
    IonContent,
    IonRouterOutlet,
    MessageOffline,
  },
  setup() {
    const { isOnline } = useConnection();

    return {
      isOnline,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-names {
  // TODO fix this hack
  height: 300px;

  .offline-message {
    margin-top: 40px;
  }
}
</style>
