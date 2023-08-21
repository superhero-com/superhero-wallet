<template>
  <div class="transaction-list-wrapper">
    <TransactionList
      v-if="isOnline"
      is-multisig
    />
    <MessageOffline
      v-else
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
  props: {
    showFilters: Boolean,
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
    text-align: center;
  }
}
</style>
