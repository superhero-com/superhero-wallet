<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="account-details-transactions">
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
import { IonContent, IonPage } from '@ionic/vue';

import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE } from '@/constants';
import {
  useAccounts,
  useConnection,
  useTransactionAndTokenFilter,
  useTransactionList,
  useUi,
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
    const { viewportElement } = useViewport();
    const { activeAccount } = useAccounts({ store });

    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList({ store });

    const { displayMode } = useTransactionAndTokenFilter();

    const loading = ref(false);
    const isDestroyed = ref(false);

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(activeAccount.value.address).nextPageUrl
    ));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(activeAccount.value.address!),
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

    watch(displayMode, () => {
      checkLoadMore();
    });

    watch(loading, async (val) => {
      if (!val) {
        await checkLoadMore();
      }
    });

    onMounted(() => {
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

    return {
      isOnline,
      loading,
      loadedTransactionList,
      loadMore,
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
