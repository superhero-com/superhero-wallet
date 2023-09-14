<template>
  <IonPage class="account-details-transactions">
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div ref="innerScrollElem">
        <TransactionList
          v-if="isOnline"
          :loading="loading"
          :transactions="loadedTransactionList"
          @load-more="loadMore()"
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.transactionsNotAvailable')"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { throttle } from 'lodash-es';

import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE, FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import {
  useAccounts,
  useConnection,
  useTransactionList,
  useUi,
  useScrollConfig,
} from '@/composables';

import MessageOffline from '@/popup/components/MessageOffline.vue';
import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  setup() {
    /**
     * TODO Extract duplicated logic of this component
     * Some of the following code was taken from
     * `src/popup/pages/AccountDetailsMultisigTransactions.vue`
     * during the multichain development.
     */

    let polling: NodeJS.Timer | null;

    const store = useStore();

    const { isOnline } = useConnection();
    const { isAppActive } = useUi();
    const { activeAccount } = useAccounts();
    const { setScrollConf } = useScrollConfig();

    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList({ store });

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const loading = ref(false);
    const isDestroyed = ref(false);

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(activeAccount.value.address).nextPageUrl
    ));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(activeAccount.value.address!),
    );

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        await fetchTransactions(
          TXS_PER_PAGE,
          !!recent,
          activeAccount.value.address,
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value && !isDestroyed.value && canLoadMore.value) {
        await fetchTransactionList();
      }
    }

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
      fetchTransactionList();
      polling = setInterval(() => {
        if (isAppActive.value) {
          fetchTransactionList(true);
        }
      }, 10000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
      isDestroyed.value = true;
    });

    onIonViewWillEnter(() => {
      setScrollConf(false);
    });

    return {
      isOnline,
      loading,
      loadedTransactionList,
      loadMore,
      innerScrollElem,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-transactions {
  --filter-top-offset: 175px;

  :deep(.filters) {
    position: sticky;
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }

  .offline-message {
    margin-top: 40px;
  }
}
</style>
