<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="transaction-list-wrapper">
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
import { IonContent, IonPage } from '@ionic/vue';
import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE } from '@/constants';
import {
  useConnection,
  useMultisigAccounts,
  usePendingMultisigTransaction,
  useTransactionAndTokenFilter,
  useTransactionList,
  useUi,
  useViewport,
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

    const currentAddress = computed(() => activeMultisigAccount.value?.gaAccountId);

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(currentAddress.value!).nextPageUrl
    ));

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
.transaction-list-wrapper {
  --filter-top-offset: 175px;

  :deep(.filters) {
    position: sticky;
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }

  .offline-message {
    text-align: center;
  }
}
</style>
