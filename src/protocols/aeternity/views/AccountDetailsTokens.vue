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
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { throttle } from 'lodash-es';
import { FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import { useConnection, useTransactionAndTokenFilter, useScrollConfig } from '@/composables';
import {
  resolveScrollableElementWithRetry,
} from '@/composables/viewport';

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
    pageWillEnter: Boolean,
  },
  setup(props) {
    const { isOnline } = useConnection();
    const { searchPhrase } = useTransactionAndTokenFilter();
    const { setScrollConf } = useScrollConfig();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const scrollContainer = ref<HTMLElement | null>(null);
    let stopResolveRetry: (() => void) | undefined;
    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );
    const onScroll = throttle(() => {
      appInnerScrollTop.value = scrollContainer.value?.scrollTop ?? 0;
    }, 200);

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    watch(
      () => props.pageWillEnter,
      (willEnter) => {
        if (willEnter) {
          setScrollConf(false);
        }
      },
    );

    onMounted(() => {
      stopResolveRetry = resolveScrollableElementWithRetry(
        appInnerElem.value ?? undefined,
        (resolved) => {
          const nextContainer = resolved as HTMLElement | null;
          if (scrollContainer.value === nextContainer) return;
          scrollContainer.value?.removeEventListener('scroll', onScroll);
          scrollContainer.value = nextContainer;
          scrollContainer.value?.addEventListener('scroll', onScroll);
        },
      );
    });

    onBeforeUnmount(() => {
      stopResolveRetry?.();
      scrollContainer.value?.removeEventListener('scroll', onScroll);
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
