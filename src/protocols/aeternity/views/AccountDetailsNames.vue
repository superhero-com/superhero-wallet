<template>
  <IonPage>
    <div class="account-details-names">
      <!-- We are disabling animations on FF because of a bug that causes flickering
        see: https://github.com/ionic-team/ionic-framework/issues/26620 -->
      <IonRouterOutlet
        v-if="isOnline"
        :animated="!IS_FIREFOX"
      />
      <MessageOffline
        v-else
        class="offline-message"
        :text="$t('modals.accountDetails.namesNotAvailable')"
      />
    </div>
  </IonPage>
</template>

<script lang="ts">
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import { IS_FIREFOX } from '@/constants';
import { useConnection } from '@/composables';
import MessageOffline from '@/popup/components/MessageOffline.vue';

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
.account-details-names {
  .offline-message {
    margin-top: 40px;
  }
}
</style>
