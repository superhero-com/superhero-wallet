<template>
  <div v-if="filteredPendings.length" data-cy="pending-txs">
    <TransactionItem
      v-for="transaction in filteredPendings"
      :key="transaction.hash"
      :transaction="transaction"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import TransactionItem from './TransactionItem';

export default {
  components: { TransactionItem },
  computed: {
    ...mapState(['transactions']),
    filteredPendings() {
      return this.transactions.pending
        .filter(({ amount, hash }) => !Number.isNaN(+amount) && hash)
        .map(({ time, hash, tipUrl, ...t }) => ({
          time,
          hash,
          tipUrl,
          tx: { ...t },
          pending: true,
        }));
    },
  },
  created() {
    const checkMined = setInterval(() => this.checkPendingTxMined(), 2500);
    this.$once('hook:destroyed', () => clearInterval(checkMined));
  },
  methods: {
    async checkPendingTxMined() {
      await Promise.all(
        this.transactions.pending.map(async ({ hash, type, amount, tipUrl }) => {
          const mined = await this.$store.state.sdk.poll(hash);
          if (!mined) return;
          const pending = this.transactions.pending.filter(p => p.hash !== hash);
          this.$store.commit('SET_PENDING_TXS', pending);
          if (type === 'tip')
            this.$router.push({ name: 'success-tip', params: { amount, tipUrl } });
          if (type === 'spend')
            this.$router.push({ name: 'send', params: { redirectstep: 3, successtx: mined } });
        }),
      );
    },
  },
};
</script>
