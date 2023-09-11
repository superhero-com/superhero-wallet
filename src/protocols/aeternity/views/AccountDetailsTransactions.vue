<template>
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
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';
import { useStore } from 'vuex';

import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE } from '@/constants';
import {
  useAccounts,
  useConnection,
  useTransactionList,
  useUi,
} from '@/composables';

import MessageOffline from '@/popup/components/MessageOffline.vue';
import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
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
    const { activeAccount } = useAccounts({ store });

    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList({ store });

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
      if (!loading.value && !isDestroyed.value && canLoadMore.value) {
        await fetchTransactionList();
      }
    }

    onMounted(() => {
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
