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
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
} from 'vue';
import { throttle } from 'lodash-es';
import { FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import { useConnection, useTransactionAndTokenFilter, useScrollConfig } from '@/composables';
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
  },
  setup() {
    const { isOnline } = useConnection();
    const { searchPhrase } = useTransactionAndTokenFilter();
    const { setScrollConf } = useScrollConfig();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    function throttledScroll() {
      return throttle(() => {
        appInnerScrollTop.value = appInnerElem?.value?.scrollTop ?? 0;
      }, 200);
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    onMounted(() => {
      if (innerScrollElem.value && appInnerElem.value) {
        appInnerElem.value.addEventListener('scroll', throttledScroll());
      }
    });

    onIonViewWillEnter(() => {
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
