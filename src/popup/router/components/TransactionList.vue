<template>
  <div class="transaction-list">
    <Filters
      v-if="displayFilter"
      v-model="displayMode"
      :filters="filters"
    />
    <div
      class="list"
      data-cy="list"
    >
      <PendingTxs />
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="transaction"
      />
    </div>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
      data-cy="loader"
    />
    <div
      v-else-if="!filteredTransactions.length"
      class="message"
    >
      <p>{{ $t('pages.recentTransactions.noTransactionsFound') }}</p>
    </div>
    <router-link
      v-if="maxLength && transactions.length > maxLength"
      to="/transactions"
      class="view-more"
    >
      <Visible class="icon" />
      <span class="text">{{ $t('pages.recentTransactions.viewMore') }}</span>
    </router-link>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { uniqBy } from 'lodash-es';
import Filters from './Filters';
import TransactionItem from './TransactionItem';
import PendingTxs from './PendingTxs';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import { TXS_PER_PAGE } from '../../utils/constants';
import Visible from '../../../icons/visible.svg?vue-component';

export default {
  components: {
    Filters,
    TransactionItem,
    PendingTxs,
    AnimatedSpinner,
    Visible,
  },
  props: {
    token: { type: String, default: '' },
    searchTerm: { type: String, default: '' },
    displayFilter: { type: Boolean, default: true },
    maxLength: { type: Number, default: null },
  },
  data() {
    return {
      loading: false,
      transactions: [],
      page: 1,
      displayMode: { rotated: true, filter: 'all', sort: 'date' },
      filters: {
        all: {}, sent: {}, received: {}, tips: {}, date: { rotated: true },
      },
    };
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapState('accounts', ['accountSelectedIdx']),
    ...mapState({
      filteredTransactions(state, { account: { address } }) {
        const isFungibleTokenTx = (tr) => Object.keys(this.availableTokens)
          .includes(tr.tx.contractId);
        return this.transactions
          .filter((tr) => (!this.token
            || (this.token !== 'aeternity'
              ? tr.tx?.contractId === this.token
              : (!tr.tx.contractId
              || !isFungibleTokenTx(tr)))))
          .filter((tr) => {
            switch (this.displayMode.filter) {
              case 'all':
                return true;
              case 'sent':
                return (tr.tx.type === 'SpendTx' && tr.tx.senderId === address)
                  || (isFungibleTokenTx(tr) && tr.tx.type === 'ContractCallTx' && tr.tx.callerId === address);
              case 'received':
                return (tr.tx.type === 'SpendTx' && tr.tx.recipientId === address)
                  || (isFungibleTokenTx(tr) && tr.tx.type === 'ContractCallTx' && tr.recipient === address);
              case 'tips':
                return (!isFungibleTokenTx(tr) && tr.tx.type === 'ContractCallTx' && tr.tx.callerId === address) || tr.claim;
              default:
                throw new Error(`Unknown display mode type: ${this.displayMode.filter}`);
            }
          })
          .filter(
            (tr) => !this.searchTerm
              || this.getTxSymbol(tr)
                .toLocaleLowerCase()
                .includes(this.searchTerm.toLocaleLowerCase()),
          )
          .sort((a, b) => {
            const arr = [a, b].map((e) => new Date(e.microTime));
            if (this.displayMode.rotated) arr.reverse();
            return arr[0] - arr[1];
          })
          .slice(0, this.maxLength || Infinity);
      },
    }),
    ...mapGetters(['getTxSymbol']),
    ...mapGetters('transactionCache', ['chainTransactions']),
  },
  watch: {
    accountSelectedIdx() {
      this.$store.commit('setTransactions', []);
      this.transactions = [];
      this.page = 1;
      this.loadMore();
    },
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
      const isDesktop = document.documentElement.clientWidth > 480 || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = isDesktop
        ? document.querySelector('#app') : document.documentElement;
      if (this.maxLength && this.filteredTransactions.length >= this.maxLength) return;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        setTimeout(() => this.loadMore(), 1500);
      }
    },
    async loadMore() {
      if (this.loading) return;
      this.loading = true;
      let result;
      try {
        await this.$watchUntilTruly(() => this.$store.state.middleware);
        result = await this.$store.dispatch('fetchTransactions', {
          page: this.page,
          limit: TXS_PER_PAGE,
        });
        this.updateTransactions(result.txs);
      } finally {
        this.loading = false;
      }
      if (result.hasMore) {
        this.page += 1;
        this.checkLoadMore();
      }
    },
    async getLatest() {
      try {
        const { txs } = await this.$store.dispatch('fetchTransactions', {
          limit: 10,
          page: 1,
          recent: true,
        });
        this.updateTransactions(txs);
      } finally {
        this.loading = false;
      }
    },
    updateTransactions(transactions) {
      this.transactions = uniqBy([...this.transactions, ...transactions, ...this.chainTransactions], 'hash');
      this.$store.commit('setTransactions', this.transactions);
      this.$store.dispatch('transactionCache/removeOldTxFromCache');
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-list {
  display: flex;
  flex-direction: column;

  .list {
    background: variables.$color-black;
    padding: 0;
    margin: 0;
  }

  .message,
  .spinner {
    flex-grow: 1;
    display: flex;
    align-items: center;
    padding-bottom: 48px;
  }

  .message > p {
    padding: 0 64px;

    @extend %face-sans-15-medium;

    color: variables.$color-light-grey;
    text-align: center;
  }

  .spinner {
    width: 56px;
    min-height: 56px;
    margin: 0 auto;
    color: variables.$color-white;
  }

  .view-more {
    padding: 12px 16px;
    border-radius: 4px;
    background: variables.$color-bg-1;
    display: flex;
    align-items: center;

    .text {
      @extend %face-sans-14-medium;

      color: variables.$color-green;
      padding-left: 4px;
    }

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      background: variables.$color-hover;

      .text {
        color: variables.$color-green-hover;
      }

      .icon {
        opacity: 1;

        path {
          fill: variables.$color-green;
        }
      }
    }

    &:active {
      background: variables.$color-bg-1;

      .text {
        opacity: 0.7;
      }

      .icon {
        opacity: 0.44;
      }
    }
  }
}
</style>
