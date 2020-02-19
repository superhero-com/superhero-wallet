<template>
  <div class="recent-transactions">
    <div class="flex flex flex-align-center flex-justify-between my-10">
      <span class="title">{{ $t('pages.recentTransactions.recentActivity') }}</span>
      <span @click="allTransactions" class="viewAll">{{ $t('pages.recentTransactions.viewAll') }}</span>
    </div>
    <PendingTxs />
    <div v-if="transactions.latest.length && !loading">
      <ae-list class="transactionList">
        <TransactionItem :recent="true" :dark="true" v-for="transaction in transactions.latest" :key="transaction.id" :transactionData="transaction"></TransactionItem>
      </ae-list>
    </div>
    <div v-if="transactions.latest.length == 0 && !loading">
      <p class="paragraph noTransactions">{{ $t('pages.recentTransactions.noTransactionsFound') }}</p>
    </div>
    <div class="loader-holder">
      <Loader size="small" :loading="loading"></Loader>
    </div>

    <slot></slot>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import BigNumber from 'bignumber.js';
import Eye from '../../../icons/eye.svg';
import PendingTxs from './PendingTxs';

export default {
  components: {
    Eye,
    PendingTxs,
  },
  data() {
    return {
      polling: null,
      loading: true,
    };
  },
  created() {
    this.updateTransactions();
    this.polling = setInterval(() => this.updateTransactions(), 5000);
    this.$once('hook:beforeDestroy', () => clearInterval(this.polling));
  },
  computed: {
    ...mapGetters(['transactions', 'account', 'sdk', 'current', 'currentCurrency']),
  },
  allTransactions() {
    this.$router.push('/transactions');
  },
  methods: {
    async updateTransactions() {
      const transactions = await this.$store.dispatch('getTransactionsByPublicKey', { publicKey: this.account.publicKey, limit: 3 });
      this.loading = false;
      this.$store.dispatch('updateLatestTransactions', transactions);
    },
    getKeyByValue(object, value) {
      return Object.keys(object).find(key => object[key] === value);
    },
    allTransactions() {
      this.$router.push('/transactions');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.recent-transactions {
  padding: 0 20px;
  padding-bottom: 20px;
  .title {
    color: $white-color !important;
  }
  .viewAll {
    color: $accent-color !important;
    cursor: pointer;
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
