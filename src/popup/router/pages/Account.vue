<template>
  <div class="popup popup-no-padding account">
    <div class="plate">
      <i18n
        v-if="!backedUpSeed"
        path="pages.account.seedNotification"
        tag="div"
        class="seed-backup-notification"
      >
        <RouterLink :to="{ name: 'settings-security' }">{{
          $t('pages.account.backup')
        }}</RouterLink>
      </i18n>
      <div class="tour__step1">
        <AccountInfo />
        <BalanceInfo />
      </div>
      <MenuCarousel />
    </div>
    <RecentTransactions />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import RecentTransactions from '../components/RecentTransactions';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import MenuCarousel from '../components/MenuCarousel';

export default {
  name: 'Account',
  components: {
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    MenuCarousel,
  },
  computed: {
    ...mapState(['tourRunning', 'backedUpSeed']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.account {
  overflow-x: hidden;

  .plate {
    position: relative;
    width: calc(2px + #{$container-width});
    margin-left: -1px;
    border: 1px solid rgba($color-border, 0.5);
    border-radius: 0 0 10px 10px;
    background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);
  }

  .menu-carousel {
    padding: 24px;
  }

  .recent-transactions {
    margin-top: -10px;
  }

  .seed-backup-notification {
    font-size: 14px;
    margin-top: 20px;
    line-height: 14px;
    color: $accent-color;
  }
}
</style>
