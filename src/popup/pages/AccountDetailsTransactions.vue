<template>
  <div class="transaction-list-wrapper">
    <TransactionList
      v-if="isOnline"
    />
    <MessageOffline
      v-else
      class="offline-message"
      :text="$t('modals.accountDetails.transactionsNotAvailable')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useConnection } from '../../composables';
import MessageOffline from '../components/MessageOffline.vue';
import TransactionList from '../components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
  },
  setup() {
    const { isOnline } = useConnection();

    return {
      isOnline,
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
    margin-top: 40px;
  }
}
</style>
