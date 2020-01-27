<template>
  <ae-main @click.native="hideMenu">
      <ae-header :class="account.publicKey && isLoggedIn ? 'logged' + (aeppPopup ? ' aeppPopup' : '') : ''">

        <!-- login screen header -->
        <div class="logo_top" :slot="menuSlot" v-if="!isLoggedIn">
          <img :src="logo_top" alt="">
          <p>
            {{ $t('pages.appVUE.systemName') }} 
            <span class="extensionVersion extensionVersionTop">{{extensionVersion}}</span></p>
          
        </div>
        
        <!-- logged in header START -->
          <!-- network dropdown -->
          <div id="network" class="dropdown" v-if="account.publicKey && isLoggedIn" :slot="menuSlot" direction="left" ref="network">
            <button v-on:click.prevent="toggleDropdown">
              <ae-icon class="dropdown-button-icon status" name="globe" slot="button" />
              <span class="dropdown-button-name" v-html="current.network" slot="button"></span>
            </button>
            <transition name="slide-fade">
              <!-- <ul v-if="dropdown.network" class="dropdown-holder"> -->
              <ae-list v-if="dropdown.network" class="dropdown-holder">
                <ae-list-item fill="neutral" @click="switchNetwork(name)" :class="current.network == name ? 'activeAccount' : '' " v-for="(value, name) in network" v-bind:key="name">
                    <!-- <ae-identicon class="subAccountIcon" v-bind:address="subaccount.publicKey" size="base" /> -->
                    <div class="subAccountInfo">
                      <div class="subAccountName">{{ name }}</div>
                      <div class="subAccountBalance" :title="value.url">{{ value.url }}</div>
                    </div>
                    <ae-check class="subAccountCheckbox"  type="radio" :value="name" v-model="current.network" /> 
                </ae-list-item>
                <ae-list-item fill="neutral" class="manageAccounts" v-if="!aeppPopup">
                  <ae-button @click="navigateNetworks" class="">
                    <ae-button face="icon" fill="primary" class="iconBtn">
                      <ae-icon name="plus" />
                    </ae-button>
                    <span class="newSubaccount">
                      {{ $t('pages.appVUE.manageNetworks') }}
                      </span>
                  </ae-button>
                </ae-list-item>
              </ae-list>
                <!-- <li v-for="(value, name) in network" v-bind:key="value.networkId">
                  <ae-button v-on:click="switchNetwork(name)" class="status triggerhidedd" :class="current.network == name ? 'current' : ''">
                      {{ name }}
                  </ae-button>
                </li>
              </ul> -->
            </transition>
          </div>

          <!-- account dropdown -->
          <div id="account" class="dropdown big" v-if="account.publicKey && isLoggedIn" :slot="menuSlot" direction="center" ref="account">
            <button v-on:click.prevent="toggleDropdown">
              <ae-identicon id="identIcon" class="dropdown-button-icon" v-bind:address="this.account.publicKey" size="base" slot="button" />
              <span class="dropdown-button-name" slot="button">{{ activeAccountName }}</span>
            </button>
            <transition name="slide-fade">
              <ae-list v-if="dropdown.account" class="dropdown-holder">
                <ae-list-item fill="neutral"  @click="changeAccount(index,subaccount)" :class="activeAccount == index ? 'activeAccount' : '' " v-for="(subaccount,index) in subaccounts" v-bind:key="index">
                    <ae-identicon class="subAccountIcon" v-bind:address="subaccount.publicKey" size="base" />
                    <div class="subAccountInfo">
                      <div class="subAccountName">{{subaccount.name}}</div>
                      <div class="subAccountBalance">{{subaccount.balance}} AE</div>
                    </div>
                    <ae-icon fill="primary" face="round" name="reload" class="name-pending" v-if="subaccount.pending"/>
                    <ae-check class="subAccountCheckbox"  type="radio" :value="index" v-model="activeAccount" /> 
                </ae-list-item>
                <ae-list-item fill="neutral" class="manageAccounts account-btn" v-if="!aeppPopup">
                  <ae-button @click="manageAccounts" class="triggerhidedd">
                    <ae-button face="icon" fill="primary" class="iconBtn">
                      <ae-icon name="plus" />
                    </ae-button>
                    <span class="newSubaccount">
                      {{ $t('pages.appVUE.manageAccounts') }}
                      </span>
                  </ae-button>
                </ae-list-item>
                <ae-list-item fill="neutral" class="airGapVault manageAccounts account-btn" v-if="!aeppPopup">
                  <ae-button @click="airGapVault" class="triggerhidedd">
                    <ae-button face="icon" fill="alternative" class="iconBtn">
                      <ae-icon name="plus" />
                    </ae-button>
                    <span class="newSubaccount">
                      {{ $t('pages.appVUE.airGapVault') }}
                      </span>
                  </ae-button>
                </ae-list-item>
                <ae-list-item fill="neutral" class="ledger manageAccounts account-btn" v-if="!aeppPopup">
                  <ae-button @click="addLedgerAccount" class="triggerhidedd">
                    <ae-button face="icon" class="iconBtn ledger">
                      <ae-icon name="plus" />
                    </ae-button>
                    <span class="newSubaccount">
                      {{ $t('pages.appVUE.ledgerAccount') }}
                      </span>
                  </ae-button>
                </ae-list-item>
              </ae-list>
            </transition>
          </div>

          <!-- settings dropdown -->
          <div id="settings" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup" :slot="mobileRight" direction="right" ref="settings">
            <button v-on:click="toggleDropdown">
              <ae-icon class="dropdown-button-icon" name="burger" slot="button" />
              <span class="dropdown-button-name" slot="button">{{ $t('pages.appVUE.menu') }}</span>
            </button>
            <transition name="slide-fade">
              <ul v-if="dropdown.settings" class="dropdown-holder">
                <li>
                  <ae-button @click="navigateAccount" class="toAccount">
                    <ae-icon name="home" />
                      {{ $t('pages.appVUE.myAccount') }}
                  </ae-button>
                </li>
                <li id="tokens" class="have-subDropdown" :class="dropdown.tokens ? 'show' : ''">
                    <ae-button @click="toggleDropdown($event, '.have-subDropdown')">
                    <ae-icon name="grid" />
                    {{ $t('pages.appVUE.switchToken') }}
                    <ae-icon name="left-more" />
                  </ae-button>

                  <!-- Tokens dropdown -->
                  <ul class="sub-dropdown">
                    <li v-for="(tkn, index) in tokens" v-if="typeof tkn.parent == 'undefined' || tkn.parent == account.publicKey" :key="index">
                      <ae-button @click="switchToken(index)" class="triggerhidedd flex flex-justify-between" >
                        <ae-identicon class="token-image" :address="tkn.contract" size="base" v-if="index != 0 "/>
                        <img :src="ae_token" class="token-image" alt="" v-if="index == 0" >
                        <span class="subAccountBalance tokenBalance">{{typeof tkn.parent == 'undefined' ? balance : tkn.balance }} {{ tkn.symbol }}</span>
                        <ae-check class="subAccountCheckbox"  type="radio" :value="index" v-model="current.token" /> 
                      </ae-button>
                    </li>
                  </ul>
                </li>
                <li id="utilities">
                  <ae-button @click="utilities" class="utilities">
                    <ae-icon name="underline" />
                    {{ $t('pages.appVUE.utilities') }}
                  </ae-button>
                </li>
                <li id="settings">
                  <ae-button @click="settings" class="settings">
                    <ae-icon name="settings" />
                    {{ $t('pages.appVUE.settings') }}
                  </ae-button>
                </li>
                <li id="toLogout">
                  <ae-button @click="logout" class="toLogout">
                    <ae-icon name="sign-out" />
                    {{ $t('pages.appVUE.logout') }}
                  </ae-button>
                </li>
              </ul>
            </transition>
          </div>


      
        <!-- logged in header END -->
      </ae-header>
    <router-view :key="$route.fullPath"></router-view>
    <span class="extensionVersion " v-if="isLoggedIn">
      {{ $t('pages.appVUE.systemName') }} 
      {{extensionVersion}} </span>
    <Loader size="big" :loading="mainLoading"></Loader>
    <div class="connect-error" v-if="connectError" >Unable to connect to choosen node</div>
  </ae-main>
</template>
 
<script>
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import store from '../store';
import locales from './locales/en.json'
import { mapGetters } from 'vuex';
import { saveAs } from 'file-saver';
import { setTimeout, clearInterval, clearTimeout, setInterval  } from 'timers';
import { initializeSDK, contractCall } from './utils/helper';
import { TOKEN_REGISTRY_CONTRACT, TOKEN_REGISTRY_CONTRACT_LIMA, TIPPING_CONTRACT } from './utils/constants'
import LedgerBridge from './utils/ledger/ledger-bridge'
import { start, postMesssage, readWebPageDom } from './utils/connection'
import { langs,fetchAndSetLocale } from './utils/i18nHelper'
import { computeAuctionEndBlock, computeBidFee } from '@aeternity/aepp-sdk/es/tx/builder/helpers'

export default {
  
  data () {
    return {
      logo_top: browser.runtime.getURL('../../../icons/icon_48.png'),
      ae_token: browser.runtime.getURL('../../../icons/ae.png'),
      language: '',
      locales: langs,
      dropdown: {
        network: false,
        settings: false,
        account: false,
        languages: false,
        tokens: false
      },
      mainLoading: true,
      checkPendingTxInterval:null,
      menuSlot:"mobile-left",
      mobileRight: "mobile-right",
      checkSDKReady:null,
      connectError:false
    }
  },
  computed: {
    ...mapGetters (['account', 'current', 'network', 'userNetworks', 'popup', 'isLoggedIn', 'AeAPI', 'subaccounts', 'activeAccount', 'activeNetwork', 'balance', 'activeAccountName', 'background', 'sdk','tokens','aeppPopup','ledgerNextIdx']),
    extensionVersion() {
      return 'v.' + browser.runtime.getManifest().version + 'beta'
    }
  },
  created: async function () {
      browser.storage.local.get('language').then((data) => {
        this.language = langs[data.language];
        this.$store.state.current.language = data.language;
        if (typeof data.language != 'undefined') {
          fetchAndSetLocale(data.language);
        }
      });
      browser.storage.local.get('activeNetwork').then((data) => {
        if (data.hasOwnProperty('activeNetwork') && data.activeNetwork != 0) {
          this.$store.state.current.network = data.activeNetwork;
        }
      });
      let background = await start(browser)
      this.$store.commit( 'SET_BACKGROUND', background )
      readWebPageDom((receiver,sendResponse ) => {
        this.$store.commit('SET_TIPPING_RECEIVER', receiver)
        sendResponse({ host:receiver.host, received: true })
      })

      //init SDK
      this.checkSDKReady = setInterval(() => {
        if(this.isLoggedIn && this.sdk == null) {

          this.initLedger()
          this.initSDK()
          
          this.pollData()
          clearInterval(this.checkSDKReady)
        }
      },500)

      setTimeout(() => {
        if(this.isLoggedIn) {
          this.pollData()
        }else {
          this.hideLoader()
        }
      },500)

      this.checkPendingTx()
      window.addEventListener('resize', () => {
        
        if(window.innerWidth <= 480) {
          this.menuSlot = "mobile-left"
          this.mobileRight = "mobile-right"
        }else {
          this.menuSlot = "default"
          this.mobileRight = "default"
        }
      });
  },
  mounted: function mounted () {
    this.dropdown.settings = false;
  },
  methods: {
    hideLoader() {
      var self = this;
      setTimeout(function() {
        self.mainLoading = false;
      }, 1500);
    },
    changeAccount (index,subaccount) {
      this.$store.commit('SET_ACTIVE_TOKEN',0)
      browser.storage.local.set({activeAccount: index}).then(() => {
        this.$store.commit('SET_ACTIVE_ACCOUNT', {publicKey:subaccount.publicKey,index:index});
        this.initSDK();
        this.dropdown.account = false;
        this.$store.commit('RESET_TRANSACTIONS',[]);
      });
    },
    hideMenu (event) {
      let target = event.target
      // Hide dropdown menu on click of the element with class triggerhidedd
      if (typeof target != 'undefined' && (target.className.indexOf('triggerhidedd') > -1 || (target.parentElement != null && target.parentElement.className.indexOf('triggerhidedd') > -1 ))) {
        let dropdownParent = event.target.closest('.dropdown');
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
        if (event.target.closest('.have-subDropdown') != null) {
          dropdownParent = event.target.closest('.have-subDropdown');
          this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
        }
      }
      for (var tar in this.dropdown) {
        let el = this.$refs[tar];
        if ( tar != 'languages' && typeof el != 'undefined' && el !== target && !el.contains(target)) {
          this.dropdown[tar]=false
        }
      }
    },
    toggleDropdown(event, parentClass) {
      if(!this.aeppPopup) {
        if (typeof parentClass == 'undefined') {
          parentClass = '.dropdown';
        }
        let dropdownParent = event.target.closest(parentClass);
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id]
      }
      
    },
    switchToken(token){
      this.current.token = token
      this.$store.commit('RESET_TRANSACTIONS',[]);
    },
    switchNetwork (network) {
      this.dropdown.network = false;
      this.$store.dispatch('switchNetwork', network).then(() => {
        this.initSDK();
        this.$store.dispatch('updateBalance');
        let transactions = this.$store.dispatch('getTransactionsByPublicKey',{publicKey:this.account.publicKey,limit:3});
        transactions.then(res => {
          this.$store.dispatch('updateLatestTransactions',res);
        });
      }); 
    },
    logout () {
      browser.storage.local.remove('isLogged').then(() => {
        browser.storage.local.remove('wallet').then(() => {
          browser.storage.local.remove('activeAccount').then(() => {
            this.dropdown.settings = false;
            this.dropdown.languages = false;
            this.dropdown.account = false;
            this.$store.commit('SET_ACTIVE_ACCOUNT', {publicKey:'',index:0});
            this.$store.commit('UNSET_SUBACCOUNTS');
            this.$store.commit('UPDATE_ACCOUNT', '');
            this.$store.commit('SWITCH_LOGGED_IN', false);
            this.$store.commit('SET_WALLET', []);
            this.$router.push('/');
          });
        });
      });
    }, 
    popupAlert(payload) {
      this.$store.dispatch('popupAlert', payload)
    },
    navigateAccount () {
      this.dropdown.settings = false;
      this.$router.push('/account');
    },
    navigateNetworks () {
      this.$router.push('/manageNetworks');
      this.dropdown.network = false;
    },
    myAccount () {
      this.dropdown.settings = false; this.dropdown.languages = false;
      this.$router.push('/account');
    },
    settings () {
      this.dropdown.settings = false; this.dropdown.languages = false;
      this.$router.push('/settings');
    },
    utilities () {
      this.dropdown.settings = false; this.dropdown.languages = false;
      this.$router.push('/utilities');
    },
    airGapVault() {
        this.$router.push('/airGapSetup')
    },
    manageAccounts () {
      this.$router.push('/manageAccounts');
      this.dropdown.network = false;
    },
    exportKeypair (type) {
      if(type == 'keypair') {
        let blobData = JSON.stringify({"publicKey": this.account.publicKey, "secretKey": this.account.secretKey});
        let blob = new Blob([blobData], {type: "application/json;charset=utf-8"});
        saveAs(blob, "keypair.json");
        this.dropdown.settings = false; this.dropdown.languages = false; 
      }else if(type == 'keystore') {
        let blobData = "";
        try {
          blobData = JSON.parse(this.account.encryptedPrivateKey);
        }catch(err) {
          blobData = JSON.stringify(this.account.encryptedPrivateKey);
        }
        let blob = new Blob([blobData], {type: "application/json;charset=utf-8"});
        saveAs(blob, "keystore.json");
        this.dropdown.settings = false; this.dropdown.languages = false;
      }
    },
    pollData() {
      let triggerOnce = false
      let running = false
      this.polling = setInterval(async () => {
        if(this.sdk != null && this.isLoggedIn) {
            if(this.current.token != 0) {
              this.$store.dispatch('updateBalanceToken')
            }
            this.$store.dispatch('updateBalance');
            if(this.dropdown.account) {
              this.$store.dispatch('updateBalanceSubaccounts');
            }
            if(this.dropdown.settings) {
              this.$store.dispatch('updateBalanceTokens');
            }
            if(!this.$router.currentRoute.path.includes("/sign-transaction")) {
              if(!running) {
                running = true
                this.$store.dispatch('updateRegisteredName').then(res => {
                  running = false
                })
              }
            }
            if(!triggerOnce) {
              this.$store.dispatch('getRegisteredNames')
              this.$store.dispatch('updateBalanceSubaccounts');
              triggerOnce = true
            }
        }
      }, 2500);
    },
    fetchApi() {
      let states = this.$store.state;
      let ae = Ae({
          url: states.network[states.current.network].url,
          internalUrl: states.network[states.current.network].internalUrl,
          keypair: {
            secretKey: states.account.secretKey,
            publicKey: states.account.publicKey,
          },
          networkId: states.network[states.current.network].networkId,
      });
      ae.then(a => {
        console.log(a);
      })
      return ae;
    },
    async initSDK() {
      let sdk = await initializeSDK(this, { network:this.network, current:this.current, account:this.account, wallet:this.wallet, activeAccount:this.activeAccount, background:this.background })
      if( typeof sdk != null && !sdk.hasOwnProperty("error")) {
       
        try {
          await this.$store.commit('SET_TOKEN_REGISTRY', 
            await this.$helpers.getContractInstance(this.network[this.current.network].networkId == "ae_uat" ? 
            TOKEN_REGISTRY_CONTRACT_LIMA : 
            TOKEN_REGISTRY_CONTRACT_LIMA, { contractAddress: this.network[this.current.network].tokenRegistry }) 
          )
        } catch (e) {

        }
        try {
          await this.$store.commit('SET_TOKEN_REGISTRY_LIMA', 
            await this.$helpers.getContractInstance(TOKEN_REGISTRY_CONTRACT_LIMA, { contractAddress: this.network[this.current.network].tokenRegistryLima }) 
          )
        } catch(e) {

        }
        try {
          await this.$store.commit('SET_TIPPING', 
            await this.$helpers.getContractInstance(TIPPING_CONTRACT, { contractAddress: this.network[this.current.network].tipContract }) 
          )
        } catch(e) {
          
        }
        
        this.$store.dispatch('getAllUserTokens')
      }
      
      if(typeof sdk.error != 'undefined') {
          await browser.storage.local.remove('isLogged')
          await browser.storage.local.remove('activeAccount')
          this.hideLoader()
          this.$store.commit('SET_ACTIVE_ACCOUNT', {publicKey:'',index:0});
          this.$store.commit('UNSET_SUBACCOUNTS');
          this.$store.commit('UPDATE_ACCOUNT', '');
          this.$store.commit('SWITCH_LOGGED_IN', false);
          
          this.$router.push('/')
      }
    },
    toTokens() {
      this.dropdown.settings = false
      this.$router.push('/tokens')
    },
    createToken() {
      this.dropdown.settings = false
      this.$router.push('/create-token')
    },
    checkPendingTx() {
      this.checkPendingTxInterval = setInterval(() => {
        browser.storage.local.get('pendingTransaction').then((pendingTx) => {
          if(!pendingTx.hasOwnProperty('pendingTransaction') || ( pendingTx.hasOwnProperty('pendingTransaction') && pendingTx.pendingTransaction.hasOwnProperty('list') && Object.keys(pendingTx.pendingTransaction.list).length <= 0 )) {
            clearInterval(this.checkPendingTxInterval)
            if(this.$router.currentRoute.path.includes("/sign-transaction") &&  this.$router.currentRoute.params.data.popup == false) {
              this.$store.commit('SET_AEPP_POPUP',false)
              this.$router.push('/account')
            }
          }
        });
      },1000)
    },
    async addLedgerAccount() {
      if(this.ledgerNextIdx != 0) {
        let account = await this.$store.dispatch('ledgerCreate')
        if(!account.success) {
          this.$store.dispatch('popupAlert', { name: 'account', type: 'ledger_account_error'})
        }
      }else {
        this.$router.push('/ledger-setup')
      }
      
    },
    initLedger() {
      let ledger = new LedgerBridge("https://waellet.com/ledger.html")
      this.$store.commit('SET_LEDGER_API', { ledger })
    },
    hideConnectError() {
      this.connectError = false
    },
    showConnectError() {
      this.connectError = true
    }
  },
  beforeDestroy() {
    clearInterval(this.polling)
  }
};
</script>

<style lang="scss">
@import '../common/base';
@-moz-document url-prefix() {
  html { scrollbar-width: none; }
  .actions .backbutton .ae-icon { vertical-align: middle !important; }
}
@-moz-document url-prefix() {
  .ae-main { width: 380px; margin:0 auto; }
}
.desktop-right { width: 100%; display: flex; justify-content: space-evenly; }
.desktop-right #account { position: relative; left: 0; top: 0; margin-left: 0; margin-top: 0; }
.ae-header header .title { display: none; }
html { min-width: 357px; min-height: 600px; background-color: #f5f5f5; }
p { font-weight: bolder; margin-left: 3px; }
input { background: transparent; border: none; border-bottom: 1px; height: 25px; line-height: 25px; }
input:focus { border-bottom: 1px solid #DDD; }
button:focus { outline: none; }
button { background: none; border: none; color: #717C87; cursor: pointer; transition: all 0.2s; }
.pageTitle { margin: 0 0 10px; }
.ae-header { border-bottom: 1px solid #EEE; margin-bottom: 10px; }
.ae-header.logged { background: #001833; }
.ae-header.logged.aeppPopup { margin-bottom:0 !important; }
.ae-header.logged > * { color: #717C87; }
.logo_top { display: flex; flex-flow: row wrap; justify-content: center; vertical-align: center; }
.logo_top p { color: #FF0D6A; font-size: 20px; line-height: 12px; }
.popup { color: #555; padding: 4px 14px; text-align: center; font-size: 16px; word-break: break-all; word-wrap: break-word; }
#network.dropdown > ul { min-width: 250px; }
#network > button { max-width: 80px; }
#network li .status::before { content: ''; display: inline-block; width: 8px; height: 8px; -moz-border-radius: 7.5px; -webkit-border-radius: 7.5px; border-radius: 7.5px; margin-right: 5px;
                border: 1px solid #DDD; background-color: #EFEFEF; }
#network li .status.current::before { border-color: green; background-color: greenyellow; }
#account { position: absolute; left: 50%; margin-left: -60px; top: 50%; margin-top: -24px; }
#account  > button { width: 120px; }
#account .dropdown-button-icon.ae-identicon.base { height: 1.8rem; margin-bottom: 3px; vertical-align: top; }
#account .ae-dropdown-button .dropdown-button-name { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subAccountInfo { margin-right:auto; margin-bottom:0 !important; max-width: 155px; }
#network .subAccountInfo { max-width: 195px; }
.subAccountIcon, .identicon { margin-right: 10px; }
.subAccountName { text-align: left; color: #000; text-overflow: ellipsis; overflow: hidden; font-weight:bold; margin-bottom:0 !important; white-space: nowrap; }
.subAccountBalance { font-family: monospace; margin-bottom:0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;}
.name-pending { width:24px !important; height:24px !important; margin-right:5px; font-size:.8rem; }
#account .subAccountCheckbox { float: right; }
#account li, #network li { padding:0.75rem; cursor:pointer !important; }
#account ul { width:250px; margin-left: -125px; max-height: 350px; height: auto; overflow-y: scroll;}
#account .activeAccount { background: #f6f6f6; }
#account .manageAccounts, #network .manageAccounts { padding:0; }
#account .manageAccounts button, #network .manageAccounts button { padding: 0.5rem 0.75rem; height: auto; justify-content: center; }
#account .account-btn button { justify-content: unset; }
#account .iconBtn, #network .iconBtn { padding: 0 !important; height: 30px !important; width: 30px; color: #fff; text-align: center; margin-right: 8px;}
#account .iconBtn i, #network .iconBtn i { color: #fff !important; font-size: 1.2rem !important; margin: 0;float: none; text-align: center;}
#account.dropdown ul li .ae-button > * { display: inline-block; vertical-align: middle; }
.subAccountCheckbox .ae-check-button { float: right; min-width: 0 !important; min-height: 0 !important; padding-left: 0 !important; }
.subAccountCheckbox .ae-check-button:before { position: static !important; }
.subAccountCheckbox .ae-check-button:after { left: 0 !important; top: 0 !important; width: 28px !important; height: 28px !important; }
.subAccountCheckbox > input[type="radio"]:checked + .ae-check-button:before, .ae-check > input[type="checkbox"]:checked + .ae-check-button:before { border-color: #dae1ea !important; }
#settings li .ae-icon { font-size: 1.2rem; margin-right: 10px; }
#settings.dropdown ul { min-width: 250px }
#languages .ae-button img { margin-right: 5px; }
#languages .ae-button.current { text-decoration: underline; }
.dropdown { display: inline-block; position: relative; vertical-align: top; }
.dropdown[direction="left"] ul { left: 0; }
.dropdown[direction="right"] ul { right: 0; }
.dropdown[direction="center"] ul { width: 200px; left: 50%; margin-left: -100px; }
.dropdown > ul { min-width: 120px; position: absolute; top: 100%; padding: 0; background-color: #FFF; z-index: 1; }
.dropdown ul { transition: all 0.2s; margin: 0; padding: 5px 0; overflow: hidden; border-radius: 4px; box-shadow: 0 0 16px rgba(0, 33, 87, 0.15); list-style: none; }
.dropdown ul.sub-dropdown { box-shadow: none; visibility: hidden; max-height:0; padding: 0; overflow: hidden; transition: all 0.3s ease-in-out; }
.dropdown .have-subDropdown.show ul.sub-dropdown { visibility: visible; max-height: 300px; overflow-y: scroll; }
.dropdown ul.sub-dropdown .ae-button { padding: 0 2rem; }
.dropdown ul li .ae-button { font-size: 14px; width: 100%; color: #000; text-align: left;  margin: 0; padding: 0 1rem; white-space: nowrap; justify-content: unset; }
.dropdown ul li .ae-button .ae-icon-left-more { margin-top: 3px; transition: all 0.3s; }
.dropdown .have-subDropdown.show .ae-button .ae-icon-left-more { transform: rotate(90deg); }
.dropdown li { color: #717C87; margin: 0; }
.dropdown li > .ae-button:hover, .sub-dropdown li:not(.backBtn) > .ae-button:hover, #network li:hover { background-color: #F3F3F3; }
.dropdown li > .ae-button { width: 100%; }
.dropdown > .ae-button { text-align: center; }
.dropdown > .ae-button, .dropdown .ae-dropdown-button { color: #717C87; vertical-align: top; height: 50px; width: 50px; display: inline-block !important; }
.dropdown .dropdown-button-icon { font-size: 1.5rem; margin: 0 auto 5px; display: block; }
.dropdown .dropdown-button-name { display: block; margin: 0 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dropdown > button:hover, .dropdown > .ae-dropdown-button:hover { color: #FFF; }
.slide-fade-enter-active { transition: all .3s ease; }
.slide-fade-leave-active { transition: all .2s ease; }
.slide-fade-enter { transform: translateY(-50px); }
.slide-fade-leave-to { transform: translateY(-50px); opacity: 0; }
.extensionVersion { color: #909090; display:block;text-align:center; padding:1.5rem 1rem; padding-bottom:2.5rem }
.extensionVersionTop { padding: 0; display: inline-block; font-size: 1rem; line-height: 12px; font-weight: normal; }
.Password .passwordStrengthMeter { position: relative; height: 5px; }
.Password + .ae-input-container { margin-top: 0 !important; }
.Password .passwordStrengthMeter .Password__strength-meter--fill[data-score="0"] { background: $primary-color }
.Password .passwordStrengthMeter .Password__strength-meter--fill[data-score="1"] { background: #d728b3 }
.Password .passwordStrengthMeter .Password__strength-meter--fill[data-score="2"] { background: #9d3fc0 }
.Password .passwordStrengthMeter .Password__strength-meter--fill[data-score="3"] { background: #1d7fe2 }
.Password .passwordStrengthMeter .Password__strength-meter--fill[data-score="4"] { background: $color-alternative }

.actions { text-align: left; }
.actions .backbutton { padding: 0; color: #9d3fc0 !important; }
.token-image { margin-right:1rem; width:28px; }
.tokenBalance { margin-right: auto; }
#tokens .ae-check-button:before { width: 20px !important; height: 20px !important; }
#tokens .ae-check-button:after { width: 26px !important; height: 25px !important; }
.connect-error { position:fixed; bottom: 0; left:0; right:0; background:$primary-color; color:#fff; padding: .3rem; text-align:center; font-weight:bold; }
</style>