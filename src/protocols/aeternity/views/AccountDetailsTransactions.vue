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
  PropType,
  computed,
  defineComponent,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { IonContent, IonPage } from '@ionic/vue';
import { throttle } from 'lodash-es';

import type { ICommonTransaction, IonicLifecycleStatus } from '@/types';
import { TXS_PER_PAGE, FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import {
  useAccounts,
  useConnection,
  useTransactionList,
  useUi,
  useScrollConfig,
  useViewport,
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
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup(props) {
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
    const { activeAccount } = useAccounts({ store });
    const { setScrollConf } = useScrollConfig();
    const { initViewport } = useViewport();

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

    function onViewDidLeaveHandler() {
      if (polling) {
        clearInterval(polling);
      }
      setScrollConf(false);
      isDestroyed.value = true;
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    watch(
      () => props.ionicLifecycleStatus,
      () => {
        if (props.ionicLifecycleStatus === 'willEnter') {
          // reset state since component might not have been unmounted
          loading.value = false;
          isDestroyed.value = false;
          setScrollConf(false);
          return;
        }

        if (props.ionicLifecycleStatus === 'didEnter') {
          initViewport(appInnerElem.value!);
          if (innerScrollElem.value && appInnerElem.value) {
            appInnerElem.value.addEventListener('scroll', throttledScroll());
          }
          fetchTransactionList();
          polling = setInterval(() => {
            if (isAppActive.value) {
              fetchTransactionList(true);
            }
          }, 10000);
          return;
        }

        if (props.ionicLifecycleStatus === 'didLeave') {
          onViewDidLeaveHandler();
        }
      },
    );

    onUnmounted(onViewDidLeaveHandler);

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
