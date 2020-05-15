<template>
  <div class="recent-transactions" :class="{ 'tour-bar': tourStartBar }">
    <div class="flex flex flex-align-center flex-justify-between mb-10 mt-20">
      <span class="title">{{ $t('pages.recentTransactions.recentActivity') }}</span>
      <router-link to="/transactions" data-cy="view-all-transactions" class="viewAll">
        {{ $t('pages.recentTransactions.viewAll') }}
      </router-link>
    </div>
    <PendingTxs />
    <div v-if="transactions.latest.length">
      <ae-list class="transactionList">
        <TransactionItem
          v-for="transaction in transactions.latest"
          :key="transaction.hash"
          :transaction="transaction"
        />
      </ae-list>
    </div>
    <div v-if="!transactions.latest.length && !transactions.pending.length">
      <p class="paragraph noTransactions">
        {{ $t('pages.recentTransactions.noTransactionsFound') }}
      </p>
    </div>
    <div class="loader-holder">
      <Loader size="small" :loading="loading" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import PendingTxs from './PendingTxs';

export default {
  components: {
    PendingTxs,
  },
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
  computed: {
    ...mapGetters(['transactions']),
    ...mapState(['tourStartBar']),
  },
  methods: {
    async updateTransactions() {
      this.$store.dispatch(
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
@import '../../../common/variables';

.recent-transactions {
  overflow: hidden;
  padding: 0 20px;
  padding-bottom: 20px;
  background: $transactions-bg;

  .title {
    color: $white-color !important;
  }

  .viewAll {
    color: $accent-color !important;
    cursor: pointer;
    text-decoration: none;
  }

  &.tour-bar {
    padding-bottom: 40px;
  }
}

.recent-transactions h3,
.recent-transactions p,
.recent-transactions .transactionList {
  color: $white-color !important;
}

.all-transactions {
  height: auto !important;
  padding: 5px 10px !important;
  width: auto !important;
}
</style>
