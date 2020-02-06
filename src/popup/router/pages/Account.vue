<template>
  <div style="background:#16161D;" class="height-100">
    <div class="popup account-popup">

      <div v-show="backup_seed_notif" class="backup_seed_notif">
        <span>
          You need to <a @click="navigateToBackUpSeed" style="text-decoration: underline;">backup</a> your seed phrase
        </span>
      </div>
      <ClaimTipButton :styling="buttonstyle"></ClaimTipButton>

      <div class="flex flex-align-center flex-justify-between account-info">
        <div class="text-left account-addresses">
          <button style="padding:0" @click="copy" v-clipboard:copy="account.publicKey"><Copyicon /></button>
          <span class="account-name">{{ activeAccountName }}</span>
          <ae-address :value="account.publicKey" length="flat" />
        </div>
      </div>

      <div class="external-svg" :style="{'background-image': 'url(' + accbalanceBG + ')'}">
        <span class="title">Balance</span>
        <div class="balance no-sign">
          <div class="amount"> <span>{{ tokenBalance }}</span> <span>{{ tokenSymbol }}</span> </div>
          <div class="currenciesgroup">
            <span> ~ </span>
            <li id="currencies" class="have-subDropdown" :class="dropdown.currencies ? 'show' : ''">
              <div class="input-group-area">
                <ae-button @click="toggleDropdown($event, '.have-subDropdown')">
                  {{ current.currencyRate ? (current.currencyRate*tokenBalance).toFixed(3) : (usdRate*tokenBalance).toFixed(3) }} 
                  <span style="color: #6A8EBE !important">{{ current.currency ? current.currency.toUpperCase() : 'USD' }}</span>
                  <DropdownArrow />
                </ae-button>
              </div>
              <ul class="sub-dropdown">
                <li class="single-currency" v-for="(index, item) in allCurrencies" v-bind:key="index">
                  <ae-button v-on:click="switchCurrency(index, item)" class="" :class="current.currency == item ? 'current' : ''">
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
        <Button style="margin-top: 26px;margin-bottom: 32px;" @click="navigateTips"> 
            <div class="flex flex-align-center flex-justify-content-center">
              <Heart /> 
              <span class="ml-5">Send æid</span> 
           </div>
        </Button>
        <RecentTransactions></RecentTransactions>
      </div> 


    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import { request } from 'http';
import { fetchData, currencyConv } from '../../utils/helper';
import { FUNGIBLE_TOKEN_CONTRACT, TOKEN_REGISTRY_ADDRESS, TOKEN_REGISTRY_CONTRACT, TOKEN_REGISTRY_CONTRACT_LIMA } from '../../utils/constants';
import Copyicon from '../../../icons/copy.svg'
import DropdownArrow from '../../../icons/dropdownarrow.svg'
import Heart from '../../../icons/heart.svg'
import RecentTransactions from '../components/RecentTransactions'

export default {
  name: 'Account',
  components: {
    Copyicon, DropdownArrow, Heart, RecentTransactions
  },
  data() {
    return {
      accbalanceBG: browser.runtime.getURL('../../../icons/acc_balance.png'),
      polling: null,
      accountName: '',
      pollingTransaction: null,
      toUsd: null,
      toEur: null,
      timer: '',
      eurRate: '',
      allCurrencies: '',
      usdRate: 0,
      currencySign: '',
      currencyFullName: '',
      dropdown: {
        currencies: false,
      },
      backup_seed_notif: false,
      pendingTip: false,
      buttonstyle: '',
    };
  },
  computed: {
    ...mapGetters([
      'account',
      'balance',
      'network',
      'current',
      'transactions',
      'subaccounts',
      'wallet',
      'activeAccountName',
      'activeAccount',
      'sdk',
      'tokens',
      'tokenSymbol',
      'tokenBalance',
      'popup',
      'isLedger',
      'tokenRegistry',
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
        let allCurrencies = JSON.parse(resall.allCurrencies);
        this.allCurrencies = allCurrencies;
        return allCurrencies;
      });
    }
  },
  async created() {
    browser.storage.local.get('rateUsd').then(res => {
      this.usdRate = res.hasOwnProperty("rateUsd") ? res.rateUsd : 0;
    });
    
    browser.storage.local.get('backed_up_Seed').then(res => {
      if (!res.backed_up_Seed) {
        this.backup_seed_notif = true;
        this.buttonstyle = 'margin-top: 2rem;';
        // setTimeout(() => (this.backup_seed_notif = false), 3000);
      } else {
        this.backup_seed_notif = false;
      }
    });
    currencyConv(this);
  },
  mounted() {},
  methods: {
    copy() {
      this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied' });
    },
    allTransactions() {
        this.$router.push('/transactions')
    },
    navigateReceive() {
      this.$router.push('/receive');
    },
    navigateTips() {
      this.$router.push('/tip');
    },
    setAccountName(e) {
      this.$store.dispatch('setAccountName', e.target.value).then(() => {
        browser.storage.local.set({ subaccounts: this.subaccounts }).then(() => {});
      });
    },
    showTransaction() {
      browser.tabs.create({ url: this.popup.data, active: false });
    },
    async toggleDropdown(event, parentClass) {
      if (typeof parentClass == 'undefined') {
        parentClass = '.currenciesgroup';
      }
      let dropdownParent = event.target.closest(parentClass);
      this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
    },
    async switchCurrency(index, item) {
      browser.storage.local.set({ currency: item }).then(() => {
        browser.storage.local.set({ currencyRate: index }).then(() => {
          switch (item) {
            case 'aud':
              this.currencySign = '$';
              this.currencyFullName = 'Australian Dollar';
              break;
            case 'brl':
              this.currencySign = 'R$';
              this.currencyFullName = 'Brazilian Real';
              break;
            case 'cad':
              this.currencySign = '$';
              this.currencyFullName = 'Canadian dollar';
              break;
            case 'chf':
              this.currencySign = 'CHF';
              this.currencyFullName = 'Swiss franc';
              break;
            case 'cny':
              this.currencySign = '¥';
              this.currencyFullName = 'Chinese yuan renminbi';
              break;
            case 'czk':
              this.currencySign = 'Kč';
              this.currencyFullName = 'Czech koruna';
              break;
            case 'dkk':
              this.currencySign = 'kr';
              this.currencyFullName = 'Danish krone';
              break;
            case 'eur':
              this.currencySign = '€';
              this.currencyFullName = 'Euro';
              break;
            case 'gbp':
              this.currencySign = '£';
              this.currencyFullName = 'Pound sterling';
              break;
            case 'hkd':
              this.currencySign = '‎$';
              this.currencyFullName = 'Hong Kong dollar';
              break;
            case 'huf':
              this.currencySign = 'Ft';
              this.currencyFullName = 'Hungarian forint';
              break;
            case 'idr':
              this.currencySign = 'Rp';
              this.currencyFullName = 'Indonesian rupiah';
              break;
            case 'ils':
              this.currencySign = '₪';
              this.currencyFullName = 'Israeli shekel';
              break;
            case 'inr':
              this.currencySign = '₹';
              this.currencyFullName = 'Indian rupee';
              break;
            case 'jpy':
              this.currencySign = '¥';
              this.currencyFullName = 'Japanese yen';
              break;
            case 'krw':
              this.currencySign = '₩';
              this.currencyFullName = 'South Korean won';
              break;
            case 'mxn':
              this.currencySign = '$';
              this.currencyFullName = 'Mexican peso';
              break;
            case 'myr':
              this.currencySign = 'RM';
              this.currencyFullName = 'Malaysian ringgit';
              break;
            case 'nok':
              this.currencySign = 'kr';
              this.currencyFullName = 'Norwegian krone';
              break;
            case 'nzd':
              this.currencySign = '$';
              this.currencyFullName = 'New Zealand dollar';
              break;
            case 'php':
              this.currencySign = '₱';
              this.currencyFullName = 'Philippine peso';
              break;
            case 'pln':
              this.currencySign = '‎zł';
              this.currencyFullName = 'Polish zloty';
              break;
            case 'rub':
              this.currencySign = '‎₽';
              this.currencyFullName = 'Russian rouble';
              break;
            case 'ron':
              this.currencySign = '‎₽';
              this.currencyFullName = 'Romanian leu';
              break;
            case 'sek':
              this.currencySign = 'kr';
              this.currencyFullName = 'Swedish krona';
              break;
            case 'sgd':
              this.currencySign = '‎S$';
              this.currencyFullName = 'Singapore dollar';
              break;
            case 'thb':
              this.currencySign = '‎฿';
              this.currencyFullName = 'Thai baht';
              break;
            case 'try':
              this.currencySign = '‎₺';
              this.currencyFullName = 'Turkish lira';
              break;
            case 'usd':
              this.currencySign = '$';
              this.currencyFullName = 'US Dollar';
              break;
            case 'xau':
              this.currencySign = 'Au';
              this.currencyFullName = 'Gold';
              break;
            case 'zar':
              this.currencySign = 'R';
              this.currencyFullName = 'South African rand';
              break;
            default:
              this.currencySign = '';
              this.currencyFullName = '';
              break;
          }
          this.$store.commit("SET_CURRENCY", { currency: item, currencyRate:index })
          this.dropdown.currencies = false;
        });
      });
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
  padding:4px 0;
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
  margin: 0px;
  min-width: 250px;
  box-shadow: none;
  visibility: hidden;
  max-height: 0;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  right: 0;
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
  .account-addresses {
    .ae-address {
      color: $text-color !important;
      font-size: 11px;
      line-height: 0.9rem;
    }
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
    :last-child { color: $secondary-color !important; }
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
  color: $accent-color !important;
  font-size: 14px;
  margin: 14px auto 32px;
}
.backup_seed_notif a {
  cursor: pointer;
  color: $accent-color !important;
}
</style>
