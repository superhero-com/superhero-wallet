<template>
  <ion-page>
    <div class="account-details-names">
      <ion-router-outlet
        v-if="isOnline"
        :animated="!IS_FIREFOX"
      />
      <MessageOffline
        v-else
        class="offline-message"
        :text="$t('modals.accountDetails.namesNotAvailable')"
      />
    </div>
  </ion-page>
</template>

<script lang="ts">
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import { IS_FIREFOX } from '@/constants';
import { useConnection } from '../../composables';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    IonPage,
    IonRouterOutlet,
    MessageOffline,
  },
  setup() {
    const { isOnline } = useConnection();

    return {
      isOnline,
      IS_FIREFOX,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.ion-padding) {
  background-color: #191919;
}

.account-details-names {
  .offline-message {
    margin-top: 40px;
  }
}
</style>
