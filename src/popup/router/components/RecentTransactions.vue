<template>
  <div class="recent-transactions" :class="{ 'tour-bar': tourStartBar }">
    <div class="flex flex flex-align-center flex-justify-between mb-10 mt-20">
      <span class="title">{{ $t('pages.recentTransactions.recentActivity') }}</span>
      <router-link to="/transactions" data-cy="view-all-transactions" class="view-all">
        {{ $t('pages.recentTransactions.viewAll') }}
      </router-link>
    </div>
    <PendingTxs />
    <div v-if="transactions.latest.length">
      <ae-list class="transaction-list">
        <TransactionItem
          v-for="transaction in transactions.latest"
          :key="transaction.hash"
          :transaction="transaction"
        />
      </ae-list>
    </div>
    <div v-if="!transactions.latest.length && !transactions.pending.length">
      <p class="paragraph">
        {{ $t('pages.recentTransactions.noTransactionsFound') }}
      </p>
    </div>
    <Loader v-if="loading" size="small" type="none" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import PendingTxs from './PendingTxs';
import TransactionItem from './TransactionItem';

export default {
  components: { PendingTxs, TransactionItem },
  data() {
    return {
      polling: null,
      loading: true,
    };
  },
  created() {
    if (this.transactions.latest.length) this.loading = false;
    this.polling = setInterval(() => this.updateTransactions(), 5000);
    this.$once('hook:beforeDestroy', () => clearInterval(this.polling));
  },
  computed: mapState(['tourStartBar', 'transactions']),
  methods: {
    async updateTransactions() {
      this.$store.commit(
        'updateLatestTransactions',
        await this.$store.dispatch('fetchTransactions', {
          limit: 3,
          page: 1,
          recent: true,
        }),
      );
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.recent-transactions {
  padding: 0 20px 20px 20px;

  .view-all {
    color: $accent-color;
    cursor: pointer;
    text-decoration: none;
  }

  &.tour-bar {
    padding-bottom: 40px;
  }

  div > p {
    font-weight: normal;
  }
}
</style>
