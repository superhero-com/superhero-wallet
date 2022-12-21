<template>
  <div class="transaction-list">
    <div
      v-if="showSearch && showSearchAndFilters"
      class="search-bar-wrapper"
    >
      <InputSearch
        v-model="searchTerm"
        :placeholder="$t('pages.recentTransactions.searchPlaceholder')"
      />
    </div>
    <Filters
      v-if="showSearchAndFilters"
      v-model="displayMode"
      :filters="filters"
      :scroll-top-threshold="scrollTopThreshold"
    />
    <div
      class="list"
      data-cy="list"
    >
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="transaction"
        :data-cy="transaction.pending && 'pending-txs'"
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
      v-if="maxLength && transactions.loaded.length > maxLength"
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
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  TXS_PER_PAGE,
  AETERNITY_CONTRACT_ID,
  MOBILE_WIDTH,
  watchUntilTruthy,
} from '../utils';
import Filters from './Filters.vue';
import TransactionItem from './TransactionItem.vue';
import InputSearch from './InputSearch.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import Visible from '../../icons/visible.svg?vue-component';

export default {
  components: {
    Filters,
    TransactionItem,
    InputSearch,
    AnimatedSpinner,
    Visible,
  },
  props: {
    token: { type: String, default: '' },
    maxLength: { type: Number, default: null },
    scrollTopThreshold: { type: Number, default: undefined },
    showFilters: Boolean,
    showSearch: Boolean,
  },
  data() {
    return {
      loading: false,
      isDestroyed: false,
      searchTerm: '',
      displayMode: { rotated: true, filter: 'all', sort: 'date' },
      filters: {
        all: {}, in: {}, out: {}, dex: {},
      },
    };
  },
  computed: {
    ...mapGetters(['getDexContracts', 'getTxSymbol']),
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapState(['transactions']),
    ...mapState({
      filteredTransactions(
        { transactions: { loaded } },
        { account: { address }, activeNetwork, getAccountPendingTransactions },
      ) {
        const isFungibleTokenTx = (tr) => Object.keys(this.availableTokens)
          .includes(tr.tx.contractId);
        return [...loaded, ...getAccountPendingTransactions]
          .filter((tr) => (!this.token
            || (this.token !== AETERNITY_CONTRACT_ID
              ? tr.tx?.contractId === this.token
              : (!tr.tx.contractId
                || !isFungibleTokenTx(tr)))))
          .filter((tr) => {
            switch (this.displayMode.filter) {
              case 'all':
                return true;
              case 'dex':
                return this.getDexContracts && tr.tx.contractId && (
                  this.getDexContracts.router.includes(tr.tx.contractId)
                  || this.getDexContracts.wae?.includes(tr.tx.contractId)
                );
              case 'out':
                return (this.compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                    && tr.tx.senderId === address)
                  || (isFungibleTokenTx(tr)
                    && this.compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                    && tr.tx.callerId === address);
              case 'in':
                return (this.compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                    && (tr.tx.recipientId === address || (tr.tx.senderId !== address && tr.tx.recipientId.startsWith('nm_'))))
                  || (isFungibleTokenTx(tr)
                    && this.compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                    && tr.recipient === address);
              case 'tips':
                return (tr.tx.contractId
                  && (activeNetwork.tipContractV1 === tr.tx.contractId
                    || activeNetwork.tipContractV2 === tr.tx.contractId)
                  && (tr.tx.function === 'tip' || tr.tx.function === 'retip')) || tr.claim;
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
            return (arr[0] - arr[1]) || a.pending;
          })
          .slice(0, this.maxLength || Infinity);
      },
    }),
    showSearchAndFilters() {
      return (
        this.showFilters
        || this.displayMode.filter !== 'all'
        || this.searchTerm
      );
    },
  },
  mounted() {
    this.loadMore();
    const polling = setInterval(() => this.getLatest(), 10000);
    const appInner = document.querySelector('.app-inner');

    appInner.addEventListener('scroll', this.checkLoadMore);
    window.addEventListener('scroll', this.checkLoadMore);
    this.$once('hook:destroyed', () => {
      appInner.removeEventListener('scroll', this.checkLoadMore);
      window.removeEventListener('scroll', this.checkLoadMore);
      clearInterval(polling);
      this.isDestroyed = true;
    });
    this.$watch(({ displayMode }) => displayMode, this.checkLoadMore);
  },
  methods: {
    checkLoadMore() {
      if (this.isDestroyed || !this.transactions.nextPageUrl) return;
      // TODO - use viewport.ts composable after rewriting component to Vue 3
      const isDesktop = document.documentElement.clientWidth > MOBILE_WIDTH
          || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = isDesktop
        ? document.querySelector('.app-inner') : document.documentElement;
      if (this.maxLength && this.filteredTransactions.length >= this.maxLength) return;
      if (scrollHeight - scrollTop <= clientHeight + 100) this.loadMore();
    },
    compareCaseInsensitive(str1, str2) {
      return str1.toLocaleLowerCase() === str2.toLocaleLowerCase();
    },
    async loadMore() {
      if (this.loading) return;
      this.loading = true;
      try {
        await watchUntilTruthy(() => this.$store.state.middleware);
        await this.$store.dispatch('fetchTransactions', { limit: TXS_PER_PAGE });
      } finally {
        this.loading = false;
      }
      this.checkLoadMore();
    },
    async getLatest() {
      try {
        await this.$store.dispatch('fetchTransactions', { limit: 10, recent: true });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-list {
  display: flex;
  flex-direction: column;

  .list {
    padding: 0;
    margin: 0;
  }

  .message,
  .spinner {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 48px;
  }

  .message > p {
    padding: 48px 64px 0;

    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
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

      color: variables.$color-success;
      padding-left: 4px;
    }

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      background: variables.$color-bg-2;

      .text {
        color: variables.$color-success-hover;
      }

      .icon {
        opacity: 1;

        path {
          fill: variables.$color-success;
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

  .search-bar-wrapper {
    background: var(--screen-bg-color);
    margin-left: calc(-1 * var(--screen-padding-x));
    margin-right: calc(-1 * var(--screen-padding-x));
    padding-inline: var(--screen-padding-x);
  }
}
</style>
