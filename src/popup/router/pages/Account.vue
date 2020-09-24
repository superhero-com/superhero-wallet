<template>
  <div class="height-100 primary-bg">
    <div class="popup popup-no-padding">
      <div v-if="!backedUpSeed && !tourRunning" class="noti" data-cy="seed-notif">
        <span>
          {{ $t('pages.account.youNeedTo') }}
          <RouterLink :to="{ name: 'settings-security' }">{{
            $t('pages.account.backup')
          }}</RouterLink>
          {{ $t('pages.account.yourSeedPhrase') }}
        </span>
      </div>
      <div class="tour__step1">
        <AccountInfo />
        <BalanceInfo />
      </div>
      <div class="submenu-bg">
        <BoxButton
          data-cy="tip-button"
          :text="$t('pages.account.send')"
          accent
          :disabled="!allowTipping"
          :to="allowTipping ? { name: 'tip' } : {}"
          class="tour__step2"
        >
          <Tip slot="icon" />
        </BoxButton>
        <BoxButton
          :text="$t('pages.account.claim')"
          accent
          :to="allowTipping ? { name: 'claim-tips' } : {}"
          :disabled="!allowTipping"
          class="tour__step4"
        >
          <Claim slot="icon" />
        </BoxButton>
        <BoxButton text="Activity" to="/transactions" class="tour__step5">
          <Activity slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.invite')" :to="{ name: 'invite' }">
          <Invite slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.topUp')" to="/receive" class="tour__step6">
          <Topup slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.withdraw')" to="/send" class="tour__step7">
          <Withdraw slot="icon" />
        </BoxButton>
        <BoxButton :text="$t('pages.appVUE.settings')" to="/settings" class="tour__step8">
          <Settings slot="icon" />
        </BoxButton>
      </div>
      <RecentTransactions />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Tip from '../../../icons/tip-icon.svg?vue-component';
import Claim from '../../../icons/claim-icon.svg?vue-component';
import Activity from '../../../icons/activity-icon.svg?vue-component';
import Topup from '../../../icons/topup-icon.svg?vue-component';
import Invite from '../../../icons/invite.svg?vue-component';
import Withdraw from '../../../icons/withdraw-icon.svg?vue-component';
import Settings from '../../../icons/settings-icon.svg?vue-component';
import RecentTransactions from '../components/RecentTransactions';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import BoxButton from '../components/BoxButton';

export default {
  name: 'Account',
  components: {
    Tip,
    Claim,
    Activity,
    Topup,
    Withdraw,
    Settings,
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    BoxButton,
    Invite,
  },
  computed: {
    ...mapState(['tourRunning', 'backedUpSeed']),
    ...mapGetters(['allowTipping']),
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
