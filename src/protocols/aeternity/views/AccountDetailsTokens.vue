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
} from 'vue';
import { throttle } from 'lodash-es';
import { FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import { useConnection, useTransactionAndTokenFilter, useScrollConfig } from '@/composables';

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

    watch(
      () => props.pageWillEnter,
      (willEnter) => {
        if (willEnter) {
          setScrollConf(false);
        }
      },
    );

    onMounted(() => {
      if (innerScrollElem.value && appInnerElem.value) {
        appInnerElem.value.addEventListener('scroll', throttledScroll());
      }
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
