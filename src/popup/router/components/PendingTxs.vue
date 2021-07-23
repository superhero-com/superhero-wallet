<template>
  <div
    v-if="transactions.length"
    class="pending-txs"
    data-cy="pending-txs"
  >
    <TransactionItem
      v-for="transaction in transactions"
      :key="transaction.hash"
      :transaction="transaction"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import TransactionItem from './TransactionItem';

export default {
  components: { TransactionItem },
  computed: mapState({
    transactions: ({ transactions: { pending } }, { getTxDirection }) => pending
      .filter((transaction) => getTxDirection(transaction) === 'sent')
      .filter(({ amount, hash }) => !Number.isNaN(+amount) && hash)
      .map((tx) => ({ ...tx, pending: true })),
  }),
};
</script>

<style lang="scss" scoped>
.pending-txs {
  .transaction-item {
    margin-bottom: 0;
  }
}
</style>
