<template>
  <div style="background:#16161D;" class="height-100">
    <div class="popup account-popup">
      <div v-show="backup_seed_notif" class="backup_seed_notif">
        <span
          >{{ $t('pages.account.youNeedTo') }} <a @click="navigateToBackUpSeed" style="text-decoration: underline;">{{ $t('pages.account.backup') }}</a>
          {{ $t('pages.account.yourSeedPhrase') }}</span
        >
      </div>
      <ClaimTipButton :styling="buttonstyle"></ClaimTipButton>

      <!-- <div class="flex flex-align-center flex-justify-between account-info">
        <div class="text-left account-addresses">
          <button style="padding:0" @click="copy" v-clipboard:copy="account.publicKey"><Copyicon /></button>
          <p class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</p>
          <span class="account-name">{{ activeAccountName }}</span>
          <ae-address :value="account.publicKey" length="flat" />
        </div>
      </div> -->
      <AccountInfo />

      <BalanceInfo />

      <div style="background: #21212A" class="height-100">
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
      polling: null,
      pollingTransaction: null,
      timer: '',
      backup_seed_notif: false,
      pendingTip: false,
      buttonstyle: '',
      IS_EXTENSION: process.env.IS_EXTENSION,
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'activeAccount', 'popup', 'tokenRegistry']),
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
    browser.storage.local.get('rateUsd').then(res => {
      this.usdRate = res.hasOwnProperty('rateUsd') ? res.rateUsd : 0;
    });
    browser.storage.local.get('backed_up_Seed').then(res => {
      if (!res.backed_up_Seed) {
        this.backup_seed_notif = true;
        setTimeout(() => {
          this.backup_seed_notif = false;
          this.buttonstyle = 'margin-top: 2rem;';
        }, 3000);
      } else {
        this.backup_seed_notif = false;
      }
    });
  },
  mounted() {},
  methods: {
    navigateTips() {
      this.$router.push('/tip');
    },
    showTransaction() {
      browser.tabs.create({ url: this.popup.data, active: false });
    },
    navigateToBackUpSeed() {
      this.$router.push('/securitySettings');
    },
  },
  beforeDestroy() {
    clearInterval(this.polling);
    clearInterval(this.pollingTransaction);
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.account-popup {
  padding: 4px 0;
}
.accountAddress {
  color: #fff;
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

.backup_seed_notif {
  font-size: 14px;
  margin: 14px auto 10px; //32
}
.backup_seed_notif span {
  color: $accent-color !important;
}
.backup_seed_notif a {
  cursor: pointer;
  color: $accent-color !important;
}
</style>
