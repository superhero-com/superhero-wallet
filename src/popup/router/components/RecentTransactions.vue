<template>
  <div
    class="recent-transactions"
    :class="{ 'tour-bar': tourStartBar }"
  >
    <div class="header">
      <span class="title">{{ $t('pages.recentTransactions.title') }}</span>
      <router-link
        to="/transactions"
        data-cy="view-all-transactions"
        class="view-all"
      >
        <Activity class="icon" />
      </router-link>
    </div>
    <PendingTxs />
    <div
      v-if="transactions.latest.length"
      class="transaction-list"
    >
      <TransactionItem
        v-for="transaction in transactions.latest.slice(0, limit)"
        :key="transaction.hash"
        :transaction="transaction"
      />
    </div>
    <router-link
      v-if="transactions.latest.length > 6"
      to="/transactions"
      class="view-more"
    >
      <Visible class="icon" />
      <span class="text">{{ $t('pages.recentTransactions.viewMore') }}</span>
    </router-link>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
    />
    <div
      v-else-if="!transactions.latest.length && !transactions.pending.length"
      class="message"
    >
      <p>{{ $t('pages.recentTransactions.noTransactionsFound') }}</p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Activity from '../../../icons/activity.svg?vue-component';
import Visible from '../../../icons/visible.svg?vue-component';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import PendingTxs from './PendingTxs';
import TransactionItem from './TransactionItem';

export default {
  components: {
    PendingTxs, TransactionItem, Activity, Visible, AnimatedSpinner,
  },
  data() {
    return {
      polling: null,
      loading: true,
      limit: 10,
    };
  },
  computed: mapState(['tourStartBar', 'transactions', 'accountSelectedIdx']),
  watch: {
    accountSelectedIdx() {
      this.$store.commit('setTransactions', []);
      this.loading = true;
      this.updateTransactions();
    },
  },
  mounted() {
    if (this.transactions.latest.length) this.loading = false;
    this.polling = setInterval(() => this.updateTransactions(), 5000);
    this.$once('hook:beforeDestroy', () => clearInterval(this.polling));
  },
  methods: {
    async updateTransactions() {
      this.$store.commit(
        'setTransactions',
        await this.$store.dispatch('fetchTransactions', {
          limit: this.limit,
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
@import '../../../styles/typography';

.recent-transactions {
  background: $color-bg-3;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: scroll;

  .header {
    padding: 21px 16px 11px 16px;
    background: $color-bg-2;
    border-radius: 0 0 4px 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      @extend %face-sans-15-medium;

      color: $color-dark-grey;
    }

    .view-all {
      width: 24px;
      height: 24px;
      padding: 0;
      cursor: pointer;
      text-decoration: none;

      .icon {
        fill: $color-white;
        opacity: 0.7;
      }

      &:hover .icon {
        opacity: 1;

        path {
          fill: $color-green-hover;
        }
      }
    }
  }

  .transaction-list > div {
    margin-bottom: 1px;
  }

  .message,
  .spinner {
    min-height: 174px;
    padding-bottom: 8px;
    flex-grow: 1;
    display: flex;
    align-items: center;
  }

  .message > p {
    padding: 0 64px;

    @extend %face-sans-15-medium;

    color: $color-light-grey;
    text-align: center;
  }

  .spinner {
    width: 56px;
    height: 56px;
    margin: 0 auto;
    color: $color-white;
  }

  .view-more {
    padding: 12px 16px;
    border-radius: 4px;
    background: $color-bg-1;
    display: flex;
    align-items: center;

    .text {
      @extend %face-sans-14-medium;

      color: $color-green;
      padding-left: 4px;
    }

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      background: $color-hover;

      .text {
        color: $color-green-hover;
      }

      .icon {
        opacity: 1;

        path {
          fill: $color-green;
        }
      }
    }

    &:active {
      background: $color-bg-1;

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
