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
        <TxHistory class="icon" />
      </router-link>
    </div>
    <TransactionList
      :display-filter="false"
      :max-length="6"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import TxHistory from '../../../icons/tx-history.svg?vue-component';
import TransactionList from './TransactionList';

export default {
  components: {
    TransactionList,
    TxHistory,
  },
  computed: mapState(['tourStartBar']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.recent-transactions {
  background: variables.$color-bg-3;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;

  .header {
    padding: 21px 16px 11px 16px;
    background: variables.$color-bg-2;
    border-radius: 0 0 4px 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      @extend %face-sans-15-medium;

      color: variables.$color-dark-grey;
    }

    .view-all {
      width: 24px;
      height: 24px;
      padding: 0;
      cursor: pointer;
      text-decoration: none;

      .icon {
        fill: variables.$color-white;
        opacity: 0.7;
      }

      &:hover .icon {
        opacity: 1;

        path {
          fill: variables.$color-green-hover;
        }
      }
    }
  }

  .transaction-list {
    flex-grow: 1;
  }
}
</style>
