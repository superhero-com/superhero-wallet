<template>
  <div class="account-details-transactions">
    <TransactionList
      v-if="isOnline"
      :transactions="transactions"
      :loading="loading"
    />
    <MessageOffline
      v-else
      class="offline-message"
      :text="$t('modals.accountDetails.transactionsNotAvailable')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { useConnection } from '@/composables';

import TransactionList from '@/popup/components/TransactionList.vue';
import MessageOffline from '@/popup/components/MessageOffline.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
  },
  setup() {
    const { isOnline } = useConnection();

    const transactions = ref([]);
    const loading = ref(false);

    return {
      isOnline,
      transactions,
      loading,
    };
  },
});
</script>
