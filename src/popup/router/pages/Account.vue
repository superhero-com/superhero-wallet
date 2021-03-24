<template>
  <div class="account" :class="{ 'has-reminder': !backedUpSeed }">
    <Plate>
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
    </Plate>
    <RecentTransactions />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import RecentTransactions from '../components/RecentTransactions';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import MenuCarousel from '../components/MenuCarousel';
import Plate from '../components/Plate';

export default {
  name: 'Account',
  components: {
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    MenuCarousel,
    Plate,
  },
  computed: {
    ...mapState(['tourRunning', 'backedUpSeed']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.account {
  .plate {
    position: sticky;
    top: 48px;
    z-index: 1;
  }

  .menu-carousel {
    padding: 24px;
  }

  .recent-transactions {
    margin-top: -10px;
  }

  .seed-backup-notification {
    font-size: 14px;
    text-align: center;
    margin-top: 20px;
    line-height: 14px;
    color: $accent-color;
  }
}
</style>
