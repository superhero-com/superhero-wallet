  <template>
  <div class="popup">
    <h3>{{ $t('pages.account.heading') }}</h3>
    <div class="currenciesgroup">
      <!-- <div class="inputGroup-currencies">
        <div class="input-group-icon">$</div>
        <div class="input-group-area"><input disabled type="text" :value=toUsd></div>
      </div>
      <div class="inputGroup-currencies">
        <div class="input-group-icon">€</div>
        <div class="input-group-area"><input disabled type="text" :value=toEur></div>
      </div> -->
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
        <ae-input-plain fill="white" :placeholder="$t('pages.account.accountName')" @keyup.native="setAccountName" :value="activeAccountName"  />
      </template>
      <template slot="header">
        <ae-text fill="white" face="mono-base">{{tokenBalance}} {{tokenSymbol}}</ae-text>
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
    <div class="actions">
      <ae-button-group>
        <ae-button face="round" fill="primary" extend class="sendBtn" @click="navigateSend">{{$t('pages.account.send') }}</ae-button>
        <ae-button face="round" fill="secondary" extend class="receiveBtn" @click="navigateReceive">{{$t('pages.account.receive') }}</ae-button>
      </ae-button-group>
    </div>
    <h3>{{$t('pages.account.latestTransactions') }}</h3>
    <div v-if="transactions.latest.length && !loading">
      <ae-list class="transactionList">
        <TransactionItem v-for="transaction in transactions.latest" v-bind:key="transaction.id" :transactionData="transaction"></TransactionItem>
      </ae-list>
      <ae-button face="round" fill="primary" class="transactionHistory" @click="showAllTranactions">{{$t('pages.account.wholeTransaction') }}</ae-button>
    </div>
    <div v-if="transactions.latest.length == 0 && !loading">
        <p class="paragraph noTransactions">{{$t('pages.account.noTransactionsFound') }}</p> 
    </div>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    <Loader size="small" :loading="loading" ></Loader>
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
      loading:true,
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
  watch:{
      publicKey() {
        this.loading = true;
        this.updateTransactions();
      },
      watchToken() {
        this.updateTransactions();
      }
  },
  created () {
    this.pollData();
    currencyConv(this);
    
  },
  mounted(){
    this.updateTransactions();
  }, 
  methods: {
    copy(){
      this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied'});
    },
    showAllTranactions() {
        this.$router.push('/transactions');
    },
    pollData() {
        this.polling = setInterval(async () => {
          if(this.sdk != null) {
            
              this.updateTransactions();
              if (this.tokenSymbol == 'AE') {
                this.toUsd = (this.balance * this.usdRate).toFixed(3);
                this.toEur = (this.balance * this.eurRate).toFixed(3);
              }
              else {
                this.toUsd = this.toEur = '---'
              }
          }
        }, 2500);
    },
    navigateSend () {
      this.$router.push('/send');
    },
    navigateReceive () {
      this.$router.push('/receive');
    },
    updateTransactions() {
      if(this.current.token == 0) {
        this.$store.dispatch('getTransactionsByPublicKey',{publicKey:this.account.publicKey,limit:3})
        .then(res => {
          this.loading = false;
          this.$store.dispatch('updateLatestTransactions',res);
        });
      }else {
        this.loading = false;
        this.$store.dispatch('updateLatestTransactions',[]);
      }
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
</style>