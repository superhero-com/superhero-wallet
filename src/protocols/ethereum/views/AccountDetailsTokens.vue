<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div
        ref="innerScrollElem"
        class="account-details-tokens"
      >
        <TokensList
          v-if="isOnline"
          class="tokens-list"
          :search-term="searchPhrase"
          :protocol="PROTOCOLS.ethereum"
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.assetsNotAvailable')"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import {
  defineComponent,
  PropType,
} from 'vue';
import type { IonicLifecycleStatus } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useConnection, useTransactionAndTokenFilter } from '@/composables';

import TokensList from '@/popup/components/FungibleTokens/TokensList.vue';
import MessageOffline from '@/popup/components/MessageOffline.vue';

export default defineComponent({
  components: {
    TokensList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  props: {
    showFilters: Boolean,
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
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
