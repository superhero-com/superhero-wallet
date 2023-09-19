<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div
        ref="innerScrollElem"
        class="transaction-list-wrapper"
      >
        <TransactionList
          v-if="isOnline"
          :loading="loading"
          :transactions="loadedTransactionList"
          is-multisig
        />
        <MessageOffline
          v-else
          :text="$t('modals.accountDetails.transactionsNotAvailable')"
        />
      </div>
    </ion-content>
  </ion-page>
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
import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE, FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import {
  useConnection,
  useMultisigAccounts,
  usePendingMultisigTransaction,
  useTransactionAndTokenFilter,
  useTransactionList,
  useUi,
  useViewport,
  useScrollConfig,
} from '@/composables';

import MessageOffline from '../components/MessageOffline.vue';
import TransactionList from '../components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    /**
     * TODO Extract duplicated logic of this component
     * Some of the following code was taken from
     * `src/protocols/aeternity/views/AccountDetailsTransactions.vue`
     * during the multichain development.
     */

    let polling: NodeJS.Timer | null;

    const store = useStore();
    const { setScrollConf } = useScrollConfig();

    const { isOnline } = useConnection();
    const { isAppActive } = useUi();
    const { viewportElement } = useViewport();
    const { activeMultisigAccount } = useMultisigAccounts({ store });

    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList({ store });

    const { displayMode } = useTransactionAndTokenFilter();

    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

    const loading = ref(false);
    const isDestroyed = ref(false);
    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);

    const currentAddress = computed(() => activeMultisigAccount.value?.gaAccountId);

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(currentAddress.value!).nextPageUrl
    ));

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    const loadedTransactionList = computed((): ICommonTransaction[] => [
      ...getAccountAllTransactions(currentAddress.value!),
      ...pendingMultisigTransaction.value ? [pendingMultisigTransaction.value] : [],
    ]);

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        await fetchTransactions(
          TXS_PER_PAGE,
          !!recent,
          currentAddress.value!,
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value) {
        await fetchTransactionList();
      }
    }

    async function checkLoadMore() {
      if (viewportElement.value && (isDestroyed.value || !canLoadMore.value)) {
        return;
      }

      const {
        scrollHeight,
        scrollTop,
        clientHeight,
      } = viewportElement.value!;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        await loadMore();
      }
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    watch(displayMode, () => {
      checkLoadMore();
    });

    watch(loading, async (val) => {
      if (!val) {
        await checkLoadMore();
      }
    });

    onMounted(() => {
      if (innerScrollElem.value && appInnerElem.value) {
        appInnerElem.value.addEventListener('scroll', () => {
          appInnerScrollTop.value = appInnerElem?.value?.scrollTop ?? 0;
        });
      }
      loadMore();
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
.transaction-list-wrapper {
  .offline-message {
    text-align: center;
  }
}
</style>
