<template>
  <div class="height-100 primary-bg">
    <div class="popup popup-no-padding">
      <div v-show="backup_seed_notif" class="noti">
        <span>
          {{ $t('pages.account.youNeedTo') }} <a href="#/securitySettings" style="text-decoration: underline;">{{ $t('pages.account.backup') }}</a>
          {{ $t('pages.account.yourSeedPhrase') }}
        </span>
      </div>
      <ClaimTipButton :class="!backup_seed_notif ? 'mt-32' : ''" />
      <AccountInfo />
      <BalanceInfo />
      <div class="height-100 secondary-bg">
        <Button v-if="IS_EXTENSION" style="margin-top: 26px;margin-bottom: 32px;" @click="navigateTips">
          <div class="flex flex-align-center flex-justify-content-center">
            <Heart />
            <span class="ml-5">{{ $t('pages.account.send') }}</span>
          </div>
        </Button>
        <RecentTransactions></RecentTransactions>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setTimeout, clearInterval } from 'timers';
import { currencyConv } from '../../utils/helper';
import Heart from '../../../icons/heart.svg';
import RecentTransactions from '../components/RecentTransactions';
import ClaimTipButton from '../components/ClaimTipButton';
import BalanceInfo from '../components/BalanceInfo';
import AccountInfo from '../components/AccountInfo';

export default {
  name: 'Account',
  components: {
    Heart,
    RecentTransactions,
    ClaimTipButton,
    BalanceInfo,
    AccountInfo,
  },
  data() {
    return {
      backup_seed_notif: false,
      IS_EXTENSION: process.env.IS_EXTENSION,
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'activeAccount', 'popup', 'current', 'network']),
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
    this.backup_seed_notif = !(await this.$store.dispatch('checkBackupSeed'));
    setTimeout(() => (this.backup_seed_notif = false), 3000);
  },
  mounted() {},
  methods: {
    navigateTips() {
      this.$router.push('/tip');
    },
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

.extensionVersion {
  display: none;
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
</style>
