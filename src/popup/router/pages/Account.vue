<template>
  <div class="account">
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
        <button
          v-for="(account, idx) in accounts"
          :key="account.address"
          :disabled="idx === accountSelectedIdx"
          @click="selectAccount(idx)"
        >
          {{ account.address }}<br />
          {{ account.name }}
        </button>
        <!--eslint-disable-next-line vue-i18n/no-raw-text-->
        <button @click="createAccount">Create account</button>
      </div>
      <MenuCarousel />
    </Plate>
    <RecentTransactions />
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import Plate from '../components/Plate';
import RecentTransactions from '../components/RecentTransactions';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import MenuCarousel from '../components/MenuCarousel';

export default {
  name: 'Account',
  components: {
    Plate,
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    MenuCarousel,
  },
  computed: {
    ...mapState(['tourRunning', 'backedUpSeed', 'accountSelectedIdx']),
    ...mapGetters(['accounts']),
  },
  methods: mapMutations(['createAccount', 'selectAccount']),
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.account {
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
