<template>
  <div class="latest-transaction">
    <div
      v-for="transaction in latestTransactions"
      :key="transaction.tx_hash"
    >
      {{ transaction.tx_hash }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useCombinedLatestTransactions } from '../../../composables';

export default defineComponent({
  name: 'LatestTransactions',
  setup() {
    const { latestTransactions } = useCombinedLatestTransactions();

    return {
      latestTransactions,
    };
  },
});
</script>

<style scoped>
.latest-transaction {
  /*  TODO */
}
</style>
