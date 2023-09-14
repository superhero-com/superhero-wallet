<template>
  <div class="account-details-transactions">
    <TransactionList
      v-if="isOnline"
      :transactions="transactions"
      :loading="loading"
      @load-more="loadMoreTransactions()"
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

import type { ITransaction } from '@/types';
import { PROTOCOL_BITCOIN } from '@/constants';
import { useAccounts, useConnection } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransactionList from '@/popup/components/TransactionList.vue';
import MessageOffline from '@/popup/components/MessageOffline.vue';
import { executeAndSetInterval } from '@/utils';
import Logger from '@/lib/logger';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
  },
  setup() {
    let pollingInterval: NodeJS.Timer;

    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);

    const { isOnline } = useConnection();
    const { activeAccount } = useAccounts();

    const transactionsLatest = ref<ITransaction[]>([]);
    const transactionsMore = ref<ITransaction[]>([]);
    const loading = ref(false);

    const transactions = computed(() => [
      ...transactionsLatest.value || [],
      ...transactionsMore.value || [],
    ]);

    async function fetchTransactionList() {
      if (!loading.value) {
        try {
          loading.value = true;
          transactionsLatest.value = await adapter.fetchTransactions(activeAccount.value.address);
        } catch (error: any) {
          Logger.write(error);
        } finally {
          loading.value = false;
        }
      }
    }

    async function loadMoreTransactions() {
      const latestTxId: string = (transactionsMore.value.length)
        ? transactionsMore.value[transactionsMore.value.length - 1].hash
        : transactionsLatest.value[transactionsLatest.value.length - 1].hash;

      if (latestTxId) {
        try {
          const result = await adapter.fetchTransactions(activeAccount.value.address, latestTxId);
          if (result?.length) {
            transactionsMore.value = [...transactionsMore.value, result];
          }
        } catch (error: any) {
          Logger.write(error);
        }
      }
    }

    onMounted(() => {
      pollingInterval = executeAndSetInterval(() => {
        fetchTransactionList();
      }, 10000);
    });

    onUnmounted(() => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    });

    return {
      isOnline,
      transactions,
      transactionsLatest,
      transactionsMore,
      loading,
      loadMoreTransactions,
    };
  },
});
</script>
