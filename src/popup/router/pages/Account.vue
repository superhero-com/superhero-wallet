<template>
  <div class="primary-bg popup popup-no-padding account">
    <i18n
      v-if="!backedUpSeed"
      path="pages.account.seedNotification"
      tag="div"
      class="seed-backup-notification"
    >
      <RouterLink :to="{ name: 'settings-security' }">{{ $t('pages.account.backup') }}</RouterLink>
    </i18n>
    <div class="tour__step1">
      <AccountInfo />
      <BalanceInfo />
    </div>
    <div class="submenu-bg">
      <BoxButton
        data-cy="tip-button"
        :text="$t('pages.account.tip')"
        accent
        :disabled="!tippingSupported"
        :to="tippingSupported ? { name: 'tip' } : {}"
        class="tour__step2"
      >
        <Tip slot="icon" />
      </BoxButton>
      <BoxButton
        :text="$t('pages.account.claim')"
        accent
        :to="tippingSupported ? { name: 'claim-tips' } : {}"
        :disabled="!tippingSupported"
        class="tour__step4"
      >
        <Claim slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.topUp')" to="/receive" class="tour__step6">
        <Topup slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.send')" to="/send" class="tour__step7">
        <Withdraw slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.account.activity')" to="/transactions" class="tour__step5">
        <Activity slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.tokens-preview')" :to="{ name: 'tokens-preview' }">
        <Tokens slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.names')" to="/names">
        <Names slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.invite')" :to="{ name: 'invite' }">
        <Invite slot="icon" />
      </BoxButton>
      <BoxButton :text="$t('pages.titles.settings')" to="/settings" class="tour__step8">
        <Settings slot="icon" />
      </BoxButton>
    </div>
    <RecentTransactions />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Tip from '../../../icons/tip-icon.svg?vue-component';
import Claim from '../../../icons/claim-icon.svg?vue-component';
import Activity from '../../../icons/activity-icon.svg?vue-component';
import Names from '../../../icons/names.svg?vue-component';
import Topup from '../../../icons/topup-icon.svg?vue-component';
import Invite from '../../../icons/invite.svg?vue-component';
import Withdraw from '../../../icons/withdraw-icon.svg?vue-component';
import Settings from '../../../icons/settings-icon.svg?vue-component';
import RecentTransactions from '../components/RecentTransactions';
import Tokens from '../../../icons/tokens.svg?vue-component';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';
import BoxButton from '../components/BoxButton';

export default {
  name: 'Account',
  components: {
    Tip,
    Claim,
    Activity,
    Names,
    Topup,
    Withdraw,
    Settings,
    RecentTransactions,
    BalanceInfo,
    AccountInfo,
    BoxButton,
    Invite,
    Tokens,
  },
  computed: {
    ...mapState(['tourRunning', 'backedUpSeed']),
    ...mapGetters(['tippingSupported']),
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.account {
  .submenu-bg {
    background: $submenu-bg;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
  }

  .seed-backup-notification {
    font-size: 14px;
    margin-top: 20px;
    line-height: 14px;
    color: $accent-color;
  }
}
</style>
