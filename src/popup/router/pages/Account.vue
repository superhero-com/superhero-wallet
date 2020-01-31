  <template>
  <div class="popup">
    <h3>{{ $t('pages.account.heading') }}</h3>
    <div v-show="backup_seed_notif" class="backup_seed_notif float">
      <p><ae-icon name="shield" class="fa fa-warning" /><span>!</span> You need to BACK UP your SEED PHRASE!</p>
      <button class="back-up-button" @click="navigateToBackUpSeed">BACK UP NOW</button>
    </div>
    <div class="currenciesgroup">
      <li id="currencies" class="have-subDropdown" :class="dropdown.currencies ? 'show' : ''">
        <div class="inputGroup-currencies">
          <div class="input-group-icon"><ae-icon name="flip"/></div>
            <div class="input-group-area">
              <ae-button @click="toggleDropdown($event, '.have-subDropdown')">
                {{ (this.current.currency && this.current.currencyRate ? currencyFullName +' '+ '('+this.current.currency.toUpperCase()+')' +' - '+ (this.current.currencyRate*tokenBalance).toFixed(3) +' '+ currencySign : 'Select currency') }}
                <ae-icon style="margin:0" name="left-more"/>
              </ae-button>
            </div>
        </div>
        <!-- Currencies sub dropdown -->
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
    <ae-card :fill="cardColor">
      <template slot="avatar">
        <ae-identicon :address="account.publicKey" />
        <!-- <span v-show="not_backedUp_seed"> ! </span> -->
        <ae-input-plain fill="white" :placeholder="$t('pages.account.accountName')" @keyup.native="setAccountName" :value="activeAccountName"  />
      </template>
      <template slot="header">
        <ae-text fill="white" face="mono-base">{{tokenBalance}} AE</ae-text>
      </template>
      <ae-address class="accountAddress" :value="account.publicKey" copyOnClick enableCopyToClipboard length="medium" gap=0 />
      <ae-toolbar :fill="cardColor" align="right" slot="footer">
        <ae-button face="toolbar" v-clipboard:copy="account.publicKey" @click="copy">
          <ae-icon name="copy" />
          {{ $t('pages.account.copy') }}
        </ae-button>
      </ae-toolbar>
    </ae-card>
    <br>
    <ae-button  face="round" fill="primary" extend @click="navigateTips" >{{ $t('pages.account.tipSomeone') }}</ae-button>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div> 
</template>

<script>

import { mapGetters } from 'vuex';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import { request } from 'http';
import { fetchData, currencyConv } from '../../utils/helper';
import { FUNGIBLE_TOKEN_CONTRACT, TOKEN_REGISTRY_ADDRESS, TOKEN_REGISTRY_CONTRACT, TOKEN_REGISTRY_CONTRACT_LIMA } from '../../utils/constants';

export default {
  name: 'Account',
  data () {
    return {
      polling: null,
      accountName:'',
      pollingTransaction:null,
      toUsd: null,
      toEur: null,
      timer: '',
      eurRate: '',
      allCurrencies: '',
      usdRate: '',
      currencySign: '',
      currencyFullName: '',
      dropdown: {
          currencies: false,
      },
      backup_seed_notif: true
    }
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current','transactions','subaccounts','wallet','activeAccountName','activeAccount','sdk','tokens','tokenSymbol','tokenBalance', 'popup','isLedger', 'tokenRegistry']),
    publicKey() { 
      return this.account.publicKey; 
    },
    watchBalance() {
      return this.balance;
    },
    watchToken() {
      return this.current.token
    },
    cardColor() {
      return this.isLedger ? 'neutral' : 'primary'
    },
    currs(){
      browser.storage.local.get('allCurrencies').then(resall => {
        let allCurrencies = JSON.parse(resall.allCurrencies)
        this.allCurrencies = allCurrencies;
        return allCurrencies;
      });
    }
  },
  async created () {
    // browser.storage.local.remove('backed_up_Seed');
    await browser.storage.local.get('backed_up_Seed').then(res => {
      if(!res.backed_up_Seed) {
        setTimeout(() => this.backup_seed_notif = false, 6000)
      } else {
        this.backup_seed_notif = false
      }
    });
    currencyConv(this);
  },
  mounted(){
  }, 
  methods: {
    copy(){
      this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied'});
    },
    showAllTranactions() {
        this.$router.push('/transactions');
    },
    navigateReceive () {
      this.$router.push('/receive');
    },
    navigateTips() {
      this.$router.push('/tip');
    },
    setAccountName(e) {
      this.$store.dispatch('setAccountName', e.target.value)
      .then(() => {
         browser.storage.local.set({ subaccounts: this.subaccounts}).then(() => {});
      });
    },
    showTransaction() {
      browser.tabs.create({url:this.popup.data,active:false});
    },
    async toggleDropdown(event, parentClass) {
        if (typeof parentClass == 'undefined') {
            parentClass = '.currenciesgroup';
        }
        let dropdownParent = event.target.closest(parentClass);
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id]

    },
    async switchCurrency(index, item) {
      browser.storage.local.set({currency: item}).then(() => {
        browser.storage.local.set({currencyRate: index}).then(() => {
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
          this.current.currency = item;
          this.current.currencyRate = index;
          this.dropdown.currencies = false;
          this.$store.state.current.currency = item;
          this.$store.state.current.currencyRate = index;
        });
      });
    },
    navigateToBackUpSeed() {
      this.$router.push('/securitySettings')
    }
  },
  beforeDestroy () {
    clearInterval(this.polling)
    clearInterval(this.pollingTransaction)
  },
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.accountAddress {
  color: #fff;
}
.paragraph {
  font-weight: normal;
}
.transactionHistory {
  margin-top:1rem;
  width: 100%;
}
.inputGroup-currencies{
  display: flex;
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}
.inputGroup-currencies > div{
  font-weight: bold;
  border-bottom: 2px solid #ff0d6a;
  vertical-align: middle;
  border-radius: 5px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  text-align: center;
}
.input-group-icon{
  background: #ff0d6a;
  color: #fff;
  padding: 0 12px;
}
.input-group-area{
  width:100%;
}
.inputGroup-currencies input{
  border: 0;
  display: block;
  font-weight: bold;
  width: 100%;
  padding: 8px;
}

.currenciesgroup li {
  list-style-type: none;
  color: #717C87;
  margin: 0;
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
  border-top:none !important
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
.backup_seed_notif {
  margin-bottom: 1.5rem;
  color: #000000;
  padding: 0.5rem;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.52), 0 6px 6px rgba(0, 0, 0, 0.25);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  font-size: 15px;
  display: block;
  position: absolute;
  z-index: 1;
  top: 66px;
  left: 0;
  background: #ffffff;
  right: 0;
  width: 80%;
  margin: 0 auto;
}
.backup_seed_notif p{
  margin: 0.5rem;
}
.backup_seed_notif span {
  position: absolute;
  color: #ff0d6a;
  left: 29px;
  top: 13px;
  font-size: 22px;
  font-weight: bold;
}
.backup_seed_notif .fa-warning {
  float: left;
  font-size: 2.6rem;
  color: #ff0d6a;
}
.float {
  animation-name: float;
  -webkit-animation-name: float;

  animation-duration: 1.5s;
  -webkit-animation-duration: 1.5s;

  animation-iteration-count: infinite;
  -webkit-animation-iteration-count: infinite;
  }


@keyframes float {
  0% {
    transform: translateY(0%);
  }
  50% {
    transform: translateY(8%);
  }
  100% {
    transform: translateY(0%);
  }
}

@-webkit-keyframes float {
  0% {
    -webkit-transform: translateY(0%);
  }
  50% {
    -webkit-transform: translateY(8%);
  }
  100% {
    -webkit-transform: translateY(0%);
  }
}

.back-up-button {
  color: #ff0d6a;
  padding: 1rem;
  background: #e0e1e3;
  width: 100%;
}
.back-up-button:hover {
  background: #d4d4d4;
}
</style>