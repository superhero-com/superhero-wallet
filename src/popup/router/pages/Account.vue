<template>
  <div class="height-100 primary-bg">
    <div class="popup popup-no-padding">
      <div v-show="backup_seed_notif" class="noti" data-cy="seed-notif">
        <span>
          {{ $t('pages.account.youNeedTo') }} <a href="#/securitySettings" style="text-decoration: underline;">{{ $t('pages.account.backup') }}</a>
          {{ $t('pages.account.yourSeedPhrase') }}
        </span>
      </div>
      <div class="tour__step1">
        <AccountInfo />
        <BalanceInfo />
      </div>
      <div class="submenu-bg">
        <BoxButton :text="$t('pages.account.send')" accent to="tip" class="tour__step2">
          <Tip slot="icon" />
        </BoxButton>
        <ClaimTips @setLoading="val => (loading = val)" v-if="IS_EXTENSION" />
        <BoxButton text="Activity" to="transactions" class="tour__step5">
          <Activity slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.topUp')" to="receive" class="tour__step6">
          <Topup slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.withdraw')" to="send" class="tour__step7">
          <Withdraw slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.settings')" to="securitySettings" class="tour__step8">
          <Settings slot="icon" />
        </BoxButton>
      </div>
      <RecentTransactions></RecentTransactions>
    </div>
    <Loader size="big" :loading="loading" type="transparent" />
    <popup />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setTimeout } from 'timers';
import Tip from '../../../icons/tip-icon.svg?vue-component';
import Activity from '../../../icons/activity-icon.svg?vue-component';
import Topup from '../../../icons/topup-icon.svg?vue-component';
import Withdraw from '../../../icons/withdraw-icon.svg?vue-component';
import Settings from '../../../icons/settings-icon.svg?vue-component';
import RecentTransactions from '../components/RecentTransactions';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import BoxButton from '../components/BoxButton';
import ClaimTips from '../components/ClaimTips';

export default {
  name: 'Account',
  components: {
    Tip,
    Activity,
    Topup,
    Withdraw,
    Settings,
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    BoxButton,
    ClaimTips,
  },
  data() {
    return {
      backup_seed_notif: false,
      loading: false,
      IS_EXTENSION: process.env.IS_EXTENSION,
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'activeAccount', 'current', 'network', 'backedUpSeed', 'tourRunning']),
    publicKey() {
      return this.account.publicKey;
    },
    watchToken() {
      return this.current.token;
    },
    cardColor() {
      return this.isLedger ? 'neutral' : 'primary';
    },
  },
  async created() {
    if (!this.tourRunning) {
      this.backup_seed_notif = !this.backedUpSeed;
      setTimeout(() => {
        if (!this.tourRunning) this.backup_seed_notif = false;
      }, 3000);
    }
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.accountAddress {
  color: $white-color;
}
.paragraph {
  font-weight: normal;
}
.transactionHistory {
  margin-top: 1rem;
  width: 100%;
}

.recent-tx {
  margin-top: 130px;
  height: 500px;
  position: relative;
  z-index: 0;
}
.recent-tx .recent-transactions {
  overflow-y: scroll;
  padding-bottom: 20px;
}
.submenu-bg {
  background: $submenu-bg;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
}
.send-tips {
  margin-bottom: 26px;
}
.noti {
  margin-top: 20px;
  margin-bottom: 0;
  line-height: 14px;
}
</style>
