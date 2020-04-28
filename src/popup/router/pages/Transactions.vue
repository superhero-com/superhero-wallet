<template>
  <div class="popup">
    <AccountInfo />
    <BalanceInfo />
    <TransactionFilters @filtrate="filtrate" />
    <ul class="all-transactions" data-cy="all-transactions">
      <PendingTxs />
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="transaction"
      />
    </ul>
    <div v-if="!filteredTransactions.length && !loading">
      <p>{{ $t('pages.transactions.noTransactions') }}</p>
    </div>
    <Loader size="small" :loading="loading" v-bind="{ content: '' }"></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { differenceWith, isEqual } from 'lodash-es';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import TransactionFilters from '../components/TransactionFilters';
import PendingTxs from '../components/PendingTxs';
import { TXS_PER_PAGE } from '../../utils/constants';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    TransactionFilters,
    PendingTxs,
  },
  props: [''],
  data() {
    return {
      loading: true,
      polling: null,
      type: '',
      dateType: '',
      transactions: [],
      page: 1,
    };
  },
  computed: {
    ...mapGetters(['account', 'middleware', 'pendingTransactions']),
    publicKey() {
      return this.account.publicKey;
    },
    filteredTransactions() {
      switch (this.type) {
        case 'date':
          if (this.dateType === 'recent') {
            return this.transactions.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
          }
          if (this.dateType === 'oldest') {
            return this.transactions.slice().sort((a, b) => new Date(a.time) - new Date(b.time));
          }
          break;
        case 'sent':
          return this.transactions.filter(
            tr => tr.tx.type === 'ContractCallTx' && tr.tx.caller_id === this.publicKey,
          );
        case 'received':
          return this.transactions.filter(
            tr => tr.tx.type === 'ContractCallTx' && tr.tx.recipient_id === this.publicKey,
          );
        case 'topups':
          return this.transactions.filter(
            tr => tr.tx.type === 'SpendTx' && tr.tx.recipient_id === this.publicKey,
          );
        case 'withdrawals':
          return this.transactions.filter(
            tr => tr.tx.sender_id && tr.tx.type === 'SpendTx' && tr.tx.sender_id === this.publicKey,
          );
        case 'all':
          return this.transactions;
        default:
          return this.transactions;
      }
      return this.transactions;
    },
  },
  created() {
    this.loadMore(true);
    this.polling = setInterval(() => this.getLatest(), 5000);
  },
  mounted() {
    const checkLoadMore = () => {
      const { scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - window.scrollY === clientHeight) {
        setTimeout(() => this.loadMore(), 1500);
      }
    };
    window.addEventListener('scroll', checkLoadMore);
    this.$once('hook:destroyed', () => {
      window.removeEventListener('scroll', checkLoadMore);
      clearInterval(this.polling);
    });
  },
  methods: {
    async filtrate(type, dateType) {
      this.type = type;
      this.dateType = dateType;
    },
    async loadMore(init = false) {
      if (this.loading && !init) return;
      await this.$watchUntilTruly(() => this.middleware);
      this.loading = true;
      const transactions = await this.$store.dispatch('fetchTransactions', {
        page: this.page,
        limit: TXS_PER_PAGE,
      });
      this.updateTransactions({ transactions });
      this.loading = false;
      if (transactions.length) this.page += 1;
    },
    async getLatest() {
      const transactions = await this.$store.dispatch('fetchTransactions', {
        limit: TXS_PER_PAGE,
        page: 1,
      });
      const diff = differenceWith(transactions, this.transactions, isEqual);
      this.updateTransactions({ latest: true, transactions: diff });
    },
    updateTransactions({ transactions, latest }) {
      if (latest) {
        this.transactions = [...transactions, ...this.transactions];
      } else {
        this.transactions = [...this.transactions, ...transactions];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.date {
  background: $button-color;
  padding: 0.5rem 1rem;
  color: $white-color;
  text-transform: uppercase;
  font-size: 0.9rem;
  font-family: monospace;
}
.popup {
  padding: 0;
}
.all-transactions {
  background: $transactions-bg;
  padding: 0 20px;
  margin: 0;
}
</style>
