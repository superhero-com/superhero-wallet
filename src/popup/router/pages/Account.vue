<template>
  <div class="account">
    <Plate>
      <i18n
        v-if="!backedUpSeed"
        path="pages.account.seedNotification"
        tag="div"
        class="seed-backup-notification"
      >
        <RouterLink :to="{ name: 'settings-security' }">
          {{ $t('pages.account.backup') }}
        </RouterLink>
      </i18n>
      <AccountSwitcher
        :notification="!backedUpSeed"
        class="tour__step1"
      />
      <MenuCarousel />
    </Plate>
    <RecentTransactions />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Plate from '../components/Plate';
import RecentTransactions from '../components/RecentTransactions';
import AccountSwitcher from '../components/AccountSwitcher';
import MenuCarousel from '../components/MenuCarousel';

export default {
  name: 'Account',
  components: {
    Plate,
    RecentTransactions,
    AccountSwitcher,
    MenuCarousel,
  },
  computed: mapState(['tourRunning', 'backedUpSeed']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.account {
  .recent-transactions {
    margin-top: -10px;
  }

  .seed-backup-notification {
    font-size: 14px;
    text-align: center;
    margin-top: 2px;
    line-height: 14px;
    color: variables.$color-green;
  }
}
</style>
