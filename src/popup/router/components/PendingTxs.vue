<template>
  <div v-if="transactions.length" data-cy="pending-txs">
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
    transactions: ({ transactions: { pending } }) =>
      pending
        .filter(({ amount, hash }) => !Number.isNaN(+amount) && hash)
        .map(({ microTime, hash, tipUrl, ...tx }) => ({
          microTime,
          hash,
          tipUrl,
          tx,
          pending: true,
        })),
  }),
};
</script>
