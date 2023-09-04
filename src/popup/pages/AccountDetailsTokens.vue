<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div
        ref="innerScrollElem"
        class="account-details-tokens"
      >
        <TokensList
          v-if="isOnline"
          class="tokens-list"
          :search-term="searchPhrase"
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.assetsNotAvailable')"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonPage, onIonViewWillLeave } from '@ionic/vue';
import {
  defineComponent, ref, computed, watch, onMounted,
} from 'vue';
import { useConnection, useTransactionAndTokenFilter, useScrollConfig } from '../../composables';
import TokensList from '../components/FungibleTokens/TokensList.vue';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    TokensList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    const FIXED_SCROLL_HEIGHT = 100;

    const { isOnline } = useConnection();
    const { searchPhrase } = useTransactionAndTokenFilter();
    const { setScrollConf } = useScrollConfig();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_SCROLL_HEIGHT);
      },
    );
    onMounted(() => {
      if (innerScrollElem.value && appInnerElem.value) {
        appInnerElem.value.addEventListener('scroll', () => {
          appInnerScrollTop.value = appInnerElem?.value?.scrollTop ?? 0;
        });
      }
    });
    onIonViewWillLeave(() => {
      setScrollConf(false);
    });
    return {
      isOnline,
      searchPhrase,
      innerScrollElem,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-tokens {
  position: relative;
  overflow: hidden;

  .tokens-list {
    padding-top: 4px;
  }

  .offline-message {
    margin-top: 40px;
  }
}
</style>
