<template>
  <div class="transaction-list">
    <Filters
      v-if="displayFilter"
      v-model="displayMode"
      :filters="filters"
      :fixed="filtersFixed"
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
import Filters from './Filters.vue';
import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import { TXS_PER_PAGE, FUNCTION_TYPE_DEX, AETERNITY_CONTRACT_ID } from '../../utils/constants';
import Visible from '../../../icons/visible.svg?vue-component';

export default {
  components: {
    Filters,
    TransactionItem,
    AnimatedSpinner,
    Visible,
  },
  props: {
    token: { type: String, default: '' },
    searchTerm: { type: String, default: '' },
    maxLength: { type: Number, default: null },
    displayFilter: Boolean,
    filtersFixed: Boolean,
  },
  data() {
    return {
      loading: false,
      isDestroyed: false,
      displayMode: { rotated: true, filter: 'all', sort: 'date' },
      filters: {
        all: {}, in: {}, out: {}, dex: {},
      },
    };
  },
  computed: {
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
                return FUNCTION_TYPE_DEX.pool.includes(tr.tx.function);
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
      this.isDestroyed = true;
    });
    this.$watch(({ displayMode }) => displayMode, this.checkLoadMore);
  },
  methods: {
    checkLoadMore() {
      if (this.isDestroyed || !this.transactions.nextPageUrl) return;
      const isDesktop = document.documentElement.clientWidth > 480 || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = isDesktop
        ? document.querySelector('#app') : document.documentElement;
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
        await this.$watchUntilTruly(() => this.$store.state.middleware);
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
@use '../../../styles/variables';
@use '../../../styles/typography';

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
