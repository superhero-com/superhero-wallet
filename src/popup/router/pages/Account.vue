<template>
  <div style="background:#16161D;" class="height-100">
    <div class="popup popup-no-padding">
      <div v-show="backup_seed_notif" class="backup_seed_notif">
        <span>
          {{ $t('pages.account.youNeedTo') }} <a @click="navigateToBackUpSeed" style="text-decoration: underline;">{{ $t('pages.account.backup') }}</a>
          {{ $t('pages.account.yourSeedPhrase') }}
        </span>
      </div>
      <div v-show="updateExtension" class="update_extension" >
        <span>{{ $t('pages.account.updateExtension') }} </span>
      </div>
      <ClaimTipButton :styling="buttonstyle"></ClaimTipButton>
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
import { TIP_SERVICE } from '../../utils/constants';

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
      buttonstyle: '',
      IS_EXTENSION: process.env.IS_EXTENSION,
      updateExtension: false
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
    const { backed_up_Seed } = await browser.storage.local.get('backed_up_Seed')
    if(!backed_up_Seed) {
      this.backup_seed_notif = true;
      setTimeout(() => {
        this.backup_seed_notif = false;
        this.buttonstyle = 'margin-top: 2rem;';
      }, 3000);
    } else {
      this.backup_seed_notif = false;
    }
    this.checkTipContractVersion()
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
    async checkTipContractVersion() {
      const { tipContract } = this.network[this.current.network]
      try {
        const latestContract = await (await fetch(`${TIP_SERVICE}/tip-contract`)).json()
        if(tipContract !== latestContract) {
          this.updateExtension = true
          this.buttonstyle = '';
        } 
      } catch(e) { this.updateExtension = false; }
    }
  },
  beforeDestroy() {
    clearInterval(this.polling);
    clearInterval(this.pollingTransaction);
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

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

.backup_seed_notif, .update_extension {
  font-size: 14px;
  margin: 14px auto 10px; //32
}
.backup_seed_notif span, .update_extension span {
  color: $accent-color !important;
}
.backup_seed_notif a {
  cursor: pointer;
  color: $accent-color !important;
}
</style>
