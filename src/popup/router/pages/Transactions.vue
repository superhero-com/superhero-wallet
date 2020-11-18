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
import { differenceWith, isEqual, uniqBy, orderBy } from 'lodash-es';
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
      loading: true,
      transactions: [],
      page: 1,
      displayMode: { latestFirst: true, type: 'all' },
    };
  },
  computed: mapState({
    filteredTransactions(state, { account: { publicKey } }) {
      return this.transactions
        .filter(tr => {
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
          const arr = [a, b].map(e => new Date(e.microTime));
          if (this.displayMode.latestFirst) arr.reverse();
          return arr[0] - arr[1];
        });
    },
  }),
  mounted() {
    this.loadMore(true);
    const polling = setInterval(() => this.getLatest(), 10000);
    const checkLoadMore = () => {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        setTimeout(() => this.loadMore(), 1500);
      }
    };
    window.addEventListener('scroll', checkLoadMore);
    this.$once('hook:destroyed', () => {
      window.removeEventListener('scroll', checkLoadMore);
      clearInterval(polling);
    });
  },
  methods: {
    async loadMore(init = false) {
      if (this.loading && !init) return;
      await this.$watchUntilTruly(() => this.$store.state.middleware);
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
        limit: 10,
        page: 1,
        recent: true,
      });
      const diff = differenceWith(transactions, this.transactions, isEqual);
      this.updateTransactions({ latest: true, transactions: diff });
    },
    updateTransactions({ transactions, latest }) {
      this.transactions = orderBy(
        uniqBy(
          latest
            ? [...transactions, ...this.transactions]
            : [...this.transactions, ...transactions],
          'hash',
        ),
        ['time'],
        ['desc'],
      );
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
