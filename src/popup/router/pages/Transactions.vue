<template>
  <div class="transactions">
    <AccountInfo />
    <BalanceInfo />
    <SearchBar v-model="searchTerm" :placeholder="$t('pages.transactions.search')" />
    <TransactionFilters v-model="displayMode" />
    <ul class="list" data-cy="list">
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
import { mapState, mapGetters } from 'vuex';
import { uniqBy } from 'lodash-es';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import SearchBar from '../components/SearchBar';
import TransactionFilters from '../components/TransactionFilters';
import TransactionItem from '../components/TransactionItem';
import PendingTxs from '../components/PendingTxs';
import { TXS_PER_PAGE } from '../../utils/constants';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    SearchBar,
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
      searchTerm: '',
    };
  },
  computed: {
    ...mapState({
      filteredTransactions(state, { account: { address } }) {
        return this.transactions
          .filter((tr) => {
            switch (this.displayMode.type) {
              case 'all':
                return true;
              case 'sent':
                return tr.tx.type === 'SpendTx' && tr.tx.senderId === address;
              case 'received':
                return tr.tx.type === 'SpendTx' && tr.tx.recipientId === address;
              case 'tips':
                return (tr.tx.type === 'ContractCallTx' && tr.tx.callerId === address) || tr.claim;
              default:
                throw new Error(`Unknown display mode type: ${this.displayMode.type}`);
            }
          })
          .filter(
            (tr) =>
              !this.searchTerm ||
              this.getTxSymbol(tr)
                .toLocaleLowerCase()
                .includes(this.searchTerm.toLocaleLowerCase()),
          )
          .sort((a, b) => {
            const arr = [a, b].map((e) => new Date(e.microTime));
            if (this.displayMode.latestFirst) arr.reverse();
            return arr[0] - arr[1];
          });
      },
    }),
    ...mapGetters(['getTxSymbol']),
  },
  mounted() {
    this.loadMore();
    const polling = setInterval(() => this.getLatest(), 10000);

    document.querySelector('#app').addEventListener('scroll', this.checkLoadMore);
    window.addEventListener('scroll', this.checkLoadMore);
    this.$once('hook:destroyed', () => {
      document.querySelector('#app').removeEventListener('scroll', this.checkLoadMore);
      window.removeEventListener('scroll', this.checkLoadMore);
      clearInterval(polling);
    });
    this.$watch(({ displayMode }) => displayMode, this.checkLoadMore);
  },
  methods: {
    checkLoadMore() {
      const { scrollHeight, scrollTop, clientHeight } =
        document.documentElement.clientWidth > 480 || process.env.IS_EXTENSION
          ? document.querySelector('#app')
          : document.documentElement;
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
      this.$store.commit('setTransactions', this.transactions);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.transactions .list {
  background: $color-black;
  padding: 0;
  margin: 0;
}
</style>
