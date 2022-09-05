<template>
  <div class="account">
    <Plate>
      <i18n
        v-if="!backedUpSeed"
        path="pages.account.seedNotification"
        tag="div"
        class="seed-backup-notification"
      >
        <RouterLink :to="{ name: 'settings-seed-phrase' }">
          {{ $t('pages.account.backup') }}
        </RouterLink>
      </i18n>
      <AccountSwitcher :notification="!backedUpSeed" />
      <div
        slot="bottom"
        class="header"
      >
        <span class="title">{{ $t('pages.recentTransactions.title') }}</span>
        <router-link
          v-if="transactions.loaded.length || getAccountPendingTransactions.length"
          to="/transactions"
          data-cy="view-all-transactions"
          class="view-all"
        >
          {{ $t('pages.recentTransactions.viewAll') }} <TxHistory class="icon" />
        </router-link>
      </div>
    </Plate>
    <TransactionList
      :display-filter="false"
      :max-length="6"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Plate from '../components/Plate.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import TxHistory from '../../../icons/history.svg?vue-component';
import TransactionList from '../components/TransactionList.vue';

export default {
  name: 'Account',
  components: {
    Plate,
    AccountSwitcher,
    TransactionList,
    TxHistory,
  },
  computed: {
    ...mapState(['backedUpSeed', 'transactions']),
    ...mapGetters(['getAccountPendingTransactions']),
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.account {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .plate .header {
    margin-top: -10px;
    padding: calc(8px + 10px) 8px 8px 16px;
    background: variables.$color-bg-2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid variables.$color-black;

    .title {
      @extend %face-sans-15-medium;

      color: variables.$color-dark-grey;
    }

    .view-all {
      display: flex;
      padding: 4px 8px;
      border-radius: 16px;
      background: variables.$color-bg-1;
      text-decoration: none;
      color: variables.$color-dark-grey;
      transition: all 0.12s ease-out;

      @extend %face-sans-15-medium;

      .icon {
        margin-left: 4px;
        height: 24px;
        width: 24px;
        color: variables.$color-white;
        opacity: 0.7;
      }

      &:hover {
        color: variables.$color-green;
        background: variables.$color-green-alpha-10;

        .icon {
          opacity: 1;
          color: variables.$color-green-hover;
        }
      }
    }
  }

  .transaction-list {
    flex-grow: 1;

    ::v-deep .list .transaction-item:first-of-type {
      margin-top: 0;
    }
  }

  .seed-backup-notification {
    text-align: center;
    margin-top: 2px;
    color: variables.$color-green;

    @extend %face-sans-14-medium;
  }
}
</style>
