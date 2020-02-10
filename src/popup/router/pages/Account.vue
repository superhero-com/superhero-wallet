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

      <div class="flex flex-align-center flex-justify-between account-info">
        <div class="text-left account-addresses">
          <button style="padding:0" @click="copy" v-clipboard:copy="account.publicKey"><Copyicon /></button>
          <p class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</p>
          <span class="account-name">{{ activeAccountName }}</span>
          <ae-address :value="account.publicKey" length="flat" />
        </div>
      </div>

      <div class="external-svg" :style="{ 'background-image': 'url(' + accbalanceBG + ')' }">
        <span class="title"> {{ $t('pages.account.balance') }} </span>
        <div class="balance no-sign">
          <div class="amount">
            <span>{{ t_tokenBalance ? t_tokenBalance : tokenBalance }}</span> <span>{{ tokenSymbol }}</span>
          </div>
          <div class="currenciesgroup">
            <span> ~ </span>
            <li id="currencies" class="have-subDropdown" :class="dropdown.currencies ? 'show' : ''">
              <div class="input-group-area">
                <ae-button @click="toggleDropdown($event, '.have-subDropdown')">
                  {{ balanceCurrency }}
                  <span style="color: #6A8EBE !important">{{ currentCurrency }}</span>
                  <DropdownArrow />
                </ae-button>
              </div>
              <ul class="sub-dropdown">
                <li class="single-currency" v-for="(index, item) in currencies" :key="index">
                  <ae-button v-on:click="switchCurrency(index, item)" :class="current.currency == item ? 'current' : ''">
                    {{ item.toUpperCase() }}
                    <i class="arrowrightCurrency"></i>
                  </ae-button>
                </li>
              </ul>
            </li>
          </div>
        </div>
      </div>

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
import Copyicon from '../../../icons/copy.svg';
import DropdownArrow from '../../../icons/dropdownarrow.svg';
import Heart from '../../../icons/heart.svg';
import RecentTransactions from '../components/RecentTransactions';
import ClaimTipButton from '../components/ClaimTipButton';

export default {
  name: 'Account',
  components: {
    Copyicon,
    DropdownArrow,
    Heart,
    RecentTransactions,
    ClaimTipButton,
  },
  data() {
    return {
      accbalanceBG: browser.runtime.getURL('../../../icons/acc_balance.png'),
      polling: null,
      accountName: '',
      pollingTransaction: null,
      timer: '',
      dropdown: {
        currencies: false,
      },
      backup_seed_notif: false,
      pendingTip: false,
      buttonstyle: '',
      copied: false,
      t_tokenBalance: null,
      IS_EXTENSION: process.env.IS_EXTENSION,
    };
  },
  computed: {
    ...mapGetters([
      'account',
      'balance',
      'current',
      'activeAccountName',
      'activeAccount',
      'tokenSymbol',
      'tokenBalance',
      'popup',
      'tokenRegistry',
      'currencies',
      'currentCurrency',
      'balanceCurrency',
    ]),
    publicKey() {
      return this.account.publicKey;
    },
    watchBalance() {
      return this.balance;
    },
    watchToken() {
      return this.current.token;
    },
    cardColor() {
      return this.isLedger ? 'neutral' : 'primary';
    },
    currs() {
      browser.storage.local.get('allCurrencies').then(resall => {
        const allCurrencies = JSON.parse(resall.allCurrencies);
        this.allCurrencies = allCurrencies;
        return allCurrencies;
      });
    }
  },
  async created() {
    await browser.storage.local.get('tokenBal').then(tokenBal => {
        if (tokenBal.tokenBal != '0.000') this.t_tokenBalance = tokenBal.tokenBal;
    });
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
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    navigateTips() {
      this.$router.push('/tip');
    },
    showTransaction() {
      browser.tabs.create({ url: this.popup.data, active: false });
    },
    async toggleDropdown(event, parentClass) {
      if (typeof parentClass === 'undefined') {
        parentClass = '.currenciesgroup';
      }
      const dropdownParent = event.target.closest(parentClass);
      this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
    },
    async switchCurrency(index, item) {
      await browser.storage.local.set({ currency: item });
      this.$store.commit('SET_CURRENCY', { currency: item, currencyRate: this.currencies[item] });
      this.dropdown.currencies = false;
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
.inputGroup-currencies {
  display: flex;
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}
.inputGroup-currencies > div {
  font-weight: bold;
  border-bottom: 2px solid #ff0d6a;
  vertical-align: middle;
  border-radius: 5px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  text-align: center;
}
.input-group-icon {
  background: #ff0d6a;
  color: #fff;
  padding: 0 12px;
}
.input-group-area {
  width: 100%;
}
.inputGroup-currencies input {
  border: 0;
  display: block;
  font-weight: bold;
  width: 100%;
  padding: 8px;
}

.currenciesgroup {
  font-size: 18px;
  width: 90%;
  display: flex;
}
.currenciesgroup li {
  list-style-type: none;
}
.currenciesgroup li .ae-icon {
  font-size: 1.2rem;
  margin: 10px 0px 0px 0px;
}
.currenciesgroup button {
  font-size: 14px;
  width: 100%;
  color: #000;
  text-align: left;
  margin: 0;
  padding: 0 1rem;
  white-space: nowrap;
  justify-content: unset;
}
.currenciesgroup ul {
  margin: 0;
  box-shadow: none;
  visibility: hidden;
  max-height: 0;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  right: 0;
  background: #21212a;
  border: 1px solid #505058;
}
.currenciesgroup .have-subDropdown.show ul.sub-dropdown {
  visibility: visible;
  max-height: 165px;
  overflow-y: scroll;
}
.currenciesgroup .have-subDropdown.show .ae-button .ae-icon-left-more {
  transform: rotate(90deg);
}
.ae-list .ae-list-item:first-child {
  border-top: none !important;
}
.sub-dropdown .single-currency:hover {
  border-left: 2px solid #ff0d6a;
  background: rgba(226, 226, 226, 0.5);
  .arrowrightCurrency {
    right: 20px;
  }
}
.arrowrightCurrency {
  transition: 0.4s;
  border: solid #565656;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
  position: absolute;
  right: 1rem;
  top: 0.8rem;
}
.account-info {
  margin: 32px 20px 0 20px;

  .account-name {
    font-size: 16px;
    color: $white-color !important;
    font-weight: 500;
    float: left;
    width: 92%;
  }
  .ae-address {
    color: $text-color !important;
    font-size: 11px;
    line-height: 0.9rem;
  }
  .account-addresses {
    position: relative;
  }
  .copied-alert {
    color: #505058;
    z-index: 1;
    top: 0;
    right: 35px;
    margin: 0;
    position: absolute;
  }
}

.external-svg {
  height: 93px;
  position: relative;
  .title {
    position: absolute;
    left: 20px;
    top: 50%;
    margin-top: -24px;
    color: $white-color !important;
    font-size: 16px;
    padding: 0;
  }
}
.balance {
  width: 163px;
  height: 60px;
  margin: auto;
  position: absolute;
  left: 50%;
  margin-left: -81px;
  top: 50%;
  margin-top: -36px;
  font-size: 26px;
  .amount {
    font-size: 26px;
    color: $text-color !important;
    :last-child {
      color: $secondary-color !important;
    }
  }
  .ae-button {
    display: block;
    font-size: 18px;
    color: $text-color !important;
  }
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
