<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div
        ref="innerScrollElem"
        class="account-details-tokens"
      >
        <AssetList
          v-if="isOnline"
          :search-term="searchPhrase"
          :protocol="PROTOCOLS.solana"
          class="tokens-list"
          owned-only
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.assetsNotAvailable')"
        />
      </div>
      <BackToTop v-if="isOnline" />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import { PROTOCOLS } from '@/constants';
import { useConnection, useTransactionAndTokenFilter } from '@/composables';

import AssetList from '@/popup/components/Assets/AssetList.vue';
import MessageOffline from '@/popup/components/MessageOffline.vue';
import BackToTop from '@/popup/components/BackToTop.vue';

export default defineComponent({
  components: {
    AssetList,
    MessageOffline,
    IonPage,
    IonContent,
    BackToTop,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    const { isOnline } = useConnection();
    const { searchPhrase } = useTransactionAndTokenFilter();

    return {
      PROTOCOLS,
      isOnline,
      searchPhrase,
    };
  },
});
</script>
