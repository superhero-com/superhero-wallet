<template>
  <div class="popup">
    <AccountInfo />
    <BalanceInfo />
    <TransactionFilters v-model="displayMode" />
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
    <Loader v-if="loading" size="small" type="none" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { uniqBy } from 'lodash-es';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import TransactionFilters from '../components/TransactionFilters';
import TransactionItem from '../components/TransactionItem';
import PendingTxs from '../components/PendingTxs';
import { TXS_PER_PAGE } from '../../utils/constants';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    TransactionFilters,
    TransactionItem,
    PendingTxs,
  },
  data() {
    return {
      loading: false,
      transactions: [],
      page: 1,
      displayMode: { latestFirst: true, type: 'all' },
    };
  },
  computed: mapState({
    filteredTransactions(state, { account: { publicKey } }) {
      return this.transactions
        .filter((tr) => {
          switch (this.displayMode.type) {
            case 'sent':
              return tr.tx.type === 'ContractCallTx' && tr.tx.callerId === publicKey;
            case 'claimed':
              return tr.claim;
            case 'topups':
              return tr.tx.type === 'SpendTx' && tr.tx.recipientId === publicKey;
            case 'withdrawals':
              return tr.tx.type === 'SpendTx' && tr.tx.senderId === publicKey;
            case 'all':
              return true;
            default:
              throw new Error(`Unknown display mode type: ${this.displayMode.type}`);
          }
        })
        .sort((a, b) => {
          const arr = [a, b].map((e) => new Date(e.microTime));
          if (this.displayMode.latestFirst) arr.reverse();
          return arr[0] - arr[1];
        });
    },
  }),
  mounted() {
    this.loadMore();
    const polling = setInterval(() => this.getLatest(), 10000);
    window.addEventListener('scroll', this.checkLoadMore);
    this.$once('hook:destroyed', () => {
      window.removeEventListener('scroll', this.checkLoadMore);
      clearInterval(polling);
    });
    this.$watch(({ displayMode }) => displayMode, this.checkLoadMore);
  },
  methods: {
    checkLoadMore() {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        setTimeout(() => this.loadMore(), 1500);
      }
    },
    async loadMore() {
      if (this.loading) return;
      this.loading = true;
      let transactions;
      try {
        await this.$watchUntilTruly(() => this.$store.state.middleware);
        transactions = await this.$store.dispatch('fetchTransactions', {
          page: this.page,
          limit: TXS_PER_PAGE,
        });
        this.updateTransactions(transactions);
      } finally {
        this.loading = false;
      }
      if (transactions.length) {
        this.page += 1;
        this.checkLoadMore();
      }
    },
    async getLatest() {
      if (this.loading) return;
      this.loading = true;
      try {
        const transactions = await this.$store.dispatch('fetchTransactions', {
          limit: 10,
          page: 1,
          recent: true,
        });
        this.updateTransactions(transactions);
      } finally {
        this.loading = false;
      }
    },
    updateTransactions(transactions) {
      this.transactions = uniqBy([...this.transactions, ...transactions], 'hash');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

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
