<template>
  <ae-main @click.native="hideMenu" :class="onAccount ? 'ae-main-account' : ''">
      <ae-header :class="account.publicKey && isLoggedIn ? 'logged' + (aeppPopup ? ' aeppPopup' : '') : ''" v-if="showNavigation">
        
        <!-- login screen header -->
          <div class="nav-title" :slot="menuSlot" v-if="!isLoggedIn">
            <p v-if="title" class="flex flex-align-center">
              <Arrow class="arrow-back" @click="goBack" /> <span class="title-text"> {{ title }} </span>
            </p>
          </div>
          
          <div style="position: absolute; left: 50%; font-size: 16px; margin-left: -50px; color: #F1F1F1;" :slot="menuSlot" v-if="isLoggedIn">
            Corona Wallet
          </div>
          <div style="height: 22px;" id="settings" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup" :slot="menuSlot" direction="left" ref="settings">
              <svg v-on:click="toggleDropdown" xmlns="http://www.w3.org/2000/svg" width="26" height="22" viewBox="0 0 26 22">
                <g id="Group_28" data-name="Group 28" transform="translate(-241 -13)">
                  <rect id="Rectangle_2" data-name="Rectangle 2" width="26" height="2" rx="1" transform="translate(241 13)" fill="#f1f1f1"/>
                  <rect id="Rectangle_3" data-name="Rectangle 3" width="26" height="2" rx="1" transform="translate(241 23)" fill="#f1f1f1"/>
                  <rect id="Rectangle_4" data-name="Rectangle 4" width="26" height="2" rx="1" transform="translate(241 33)" fill="#f1f1f1"/>
                </g>
              </svg>
            <transition name="slide-fade">
              <ul v-if="dropdown.settings" class="dropdown-holder">
                <li>
                  <ae-button @click="topUp">
                    <!-- <ae-icon  /> -->
                      {{ $t('pages.appVUE.topUp') }}
                  </ae-button>
                </li>
                <li >
                  <ae-button @click="withdraw">
                    <!-- <ae-icon  /> -->
                    {{ $t('pages.appVUE.withdraw') }}
                  </ae-button>
                </li>
                <li >
                  <ae-button @click="transactions">
                    <!-- <ae-icon  /> -->
                    {{ $t('pages.appVUE.myTransactions') }}
                  </ae-button>
                </li>
              </ul>
            </transition>
          </div>
          
          <div id="account" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup" :slot="mobileRight" direction="right" ref="account">
            <svg style="margin: 6px;" xmlns="http://www.w3.org/2000/svg" width="17.437" height="22" viewBox="0 0 17.437 22">
              <g id="bell" transform="translate(-53.013 0)">
                <path id="Path_236" data-name="Path 236" d="M184.9,465.044a3.649,3.649,0,0,0,6.68,0Z" transform="translate(-126.512 -445.223)" fill="#f1f1f1"/>
                <path id="Path_237" data-name="Path 237" d="M199.079,2.308a8.208,8.208,0,0,1,2.8.491V2.691A2.694,2.694,0,0,0,199.191,0h-.223a2.694,2.694,0,0,0-2.691,2.691V2.8A8.225,8.225,0,0,1,199.079,2.308Z" transform="translate(-137.348)" fill="#f1f1f1"/>
                <path id="Path_238" data-name="Path 238" d="M69.788,93.513H53.676a.652.652,0,0,1-.647-.482.593.593,0,0,1,.345-.682,3.3,3.3,0,0,0,1.04-1.354A15.046,15.046,0,0,0,55.5,84.8a6.24,6.24,0,0,1,12.466-.024c0,.008,0,.016,0,.024a15.046,15.046,0,0,0,1.085,6.191,3.3,3.3,0,0,0,1.04,1.354.592.592,0,0,1,.345.682A.652.652,0,0,1,69.788,93.513Zm.31-1.16h0Z" transform="translate(0 -75.11)" fill="#f1f1f1"/>
              </g>
            </svg>

            <button style="width: 38px; height: 38px; padding: 0; margin-top: 6px;margin-bottom: 6px;" v-on:click="toggleDropdown">
              <ae-identicon id="identIcon" class="dropdown-button-icon" v-bind:address="this.account.publicKey" size="base" slot="button" />
            </button>
            <transition name="slide-fade">
              <ul v-if="dropdown.account" class="dropdown-holder">
                <li>
                  <ae-button @click="profile">
                    <ae-icon name="contacts" />
                    {{ $t('pages.appVUE.profile') }}
                  </ae-button>
                </li>
                <li>
                  <ae-button @click="settings" >
                    <ae-icon name="settings" />
                    {{ $t('pages.appVUE.settings') }}
                  </ae-button>
                </li>
                <!-- <li>
                  <ae-button >
                    <ae-icon name="settings" />
                    {{ $t('pages.appVUE.advanced') }}
                  </ae-button>
                </li> -->
                <li>
                  <ae-button @click="about" >
                    <ae-icon name="info" />
                    {{ $t('pages.appVUE.help') }}
                  </ae-button>
                </li>
              </ul>
            </transition>
          </div>
      </ae-header>
      <hr style="margin: 0; background: #3a3a47; height: 2px; border: 0;">
    <router-view :key="$route.fullPath"></router-view>
    <span class="extensionVersion " v-if="isLoggedIn && !onAccount">
      {{ $t('pages.appVUE.systemName') }}
      {{ extensionVersion }}
    </span>
    <Loader size="big" :loading="mainLoading"></Loader>
    <div class="connect-error" v-if="connectError">Unable to connect to choosen node</div>
  </ae-main>
</template>

<script>
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import { mapGetters } from 'vuex';
import { saveAs } from 'file-saver';
import { computeAuctionEndBlock, computeBidFee } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import store from '../store';
import locales from './locales/en.json';
// import { setTimeout, clearInterval, clearTimeout, setInterval  } from 'timers';
import { initializeSDK, contractCall } from './utils/helper';
import { TOKEN_REGISTRY_CONTRACT, TOKEN_REGISTRY_CONTRACT_LIMA, TIPPING_CONTRACT, AEX2_METHODS } from './utils/constants';
import { start, postMessage, readWebPageDom } from './utils/connection';
import { langs, fetchAndSetLocale } from './utils/i18nHelper';
import Arrow from '../icons/arrow.svg';
export default {
  components: {
    Arrow
  },
  data() {
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
        tokens: false,
      },
      mainLoading: true,
      checkPendingTxInterval:null,
      menuSlot:"mobile-left",
      mobileRight: "mobile-right",
      defaulT: "default",
      checkSDKReady:null,
      connectError:false,
      onAccount:false,
      showNavigation: false,
      title: ''
    }
  },
  computed: {
    ...mapGetters([
      'account',
      'current',
      'network',
      'popup',
      'isLoggedIn',
      'subaccounts',
      'activeAccount',
      'activeNetwork',
      'balance',
      'activeAccountName',
      'background',
      'sdk',
      'aeppPopup',
    ]),
    extensionVersion() {
      return `v.${browser.runtime.getManifest().version}`;
    },
  },
  watch: {
    $route(to, from) {
      this.title = to.meta.title || ''
      if (to.path == '/account') {
        this.onAccount = true;
      } else {
        this.onAccount = false;
      }

      if(to.path !== '/') {
        this.showNavigation = true
      } else {
        this.showNavigation = false
      }
    },
  },
  async created() {
    if(this.$router.currentRoute.path !== '/') {
      this.showNavigation = true
    } 
    this.title = this.$router.currentRoute.meta.title
    browser.storage.local.get('language').then(data => {
      this.language = langs[data.language];
      this.$store.state.current.language = data.language;
      if (typeof data.language !== 'undefined') {
        fetchAndSetLocale(data.language);
      }
    });
    browser.storage.local.get('activeNetwork').then(data => {
      if (data.hasOwnProperty('activeNetwork') && data.activeNetwork != 0) {
        this.$store.state.current.network = data.activeNetwork;
      }
    });
    const background = await start(browser);
    this.$store.commit('SET_BACKGROUND', background);
    readWebPageDom((receiver, sendResponse) => {
      this.$store.commit('SET_TIPPING_RECEIVER', receiver);
      sendResponse({ host: receiver.host, received: true });
    });

    if (!process.env.RUNNING_IN_POPUP) {
      // init SDK
      this.checkSdkReady();
      setTimeout(() => {
        if (this.isLoggedIn) {
          if (this.sdk == null) {
            this.initSDK();
          }
          this.pollData();
        } else {
          this.hideLoader();
        }
      }, 500);
    } else {
      this.hideLoader();
    }
    this.setMenuSlots()
    window.addEventListener('resize', () => {
      this.setMenuSlots()
    });
  },
  mounted: function mounted() {
    this.dropdown.settings = false;
  },
  methods: {
    setMenuSlots() {
      if(window.innerWidth <= 480) {
        this.menuSlot = "mobile-left"
        this.menuSlot = "default"
        this.mobileRight = "mobile-right"
      }else {
        this.menuSlot = "default"
        this.menuSlot = "default"
        this.mobileRight = "default"
      }
    },
    checkSdkReady() {
      if (!process.env.RUNNING_IN_POPUP) {
        this.checkSDKReady = setInterval(() => {
          if (this.isLoggedIn && this.sdk == null) {
            this.initRpcWallet();
            this.initSDK();
            this.pollData();
            clearInterval(this.checkSDKReady);
          }
        }, 500);
      }
    },
    hideLoader() {
      const self = this;
      setTimeout(() => {
        self.mainLoading = false;
      }, 1500);
    },
    hideMenu(event) {
      const { target } = event;
      // Hide dropdown menu on click of the element with class triggerhidedd
      if (
        typeof target !== 'undefined' &&
        (target.className.indexOf('triggerhidedd') > -1 || (target.parentElement != null && target.parentElement.className.indexOf('triggerhidedd') > -1))
      ) {
        let dropdownParent = event.target.closest('.dropdown');
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
        if (event.target.closest('.have-subDropdown') != null) {
          dropdownParent = event.target.closest('.have-subDropdown');
          this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
        }
      }
      for (const tar in this.dropdown) {
        const el = this.$refs[tar];
        if (tar != 'languages' && typeof el !== 'undefined' && el !== target && !el.contains(target)) {
          this.dropdown[tar] = false;
        }
      }
    },
    toggleDropdown(event, parentClass) {
      if (!this.aeppPopup) {
        if (typeof parentClass === 'undefined') {
          parentClass = '.dropdown';
        }
        const dropdownParent = event.target.closest(parentClass);
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
      }
    },
    switchNetwork(network) {
      this.dropdown.network = false;
      this.$store.dispatch('switchNetwork', network).then(() => {
        postMessage(this.background, { type: AEX2_METHODS.SWITCH_NETWORK, payload: network });
        this.initSDK();
        this.$store.dispatch('updateBalance');
      });
    },
    logout() {
      browser.storage.local.remove('isLogged').then(() => {
        browser.storage.local.remove('wallet').then(() => {
          browser.storage.local.remove('activeAccount').then(() => {
            this.dropdown.settings = false;
            this.dropdown.languages = false;
            this.dropdown.account = false;
            this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: '', index: 0 });
            this.$store.commit('UNSET_SUBACCOUNTS');
            this.$store.commit('UPDATE_ACCOUNT', '');
            this.$store.commit('SWITCH_LOGGED_IN', false);
            this.$store.commit('SET_WALLET', []);
            this.$store.dispatch('initSdk', null);
            postMessage(this.background, { type: AEX2_METHODS.LOGOUT });
            this.checkSdkReady();
            this.$router.push('/');
          });
        });
      });
    },
    popupAlert(payload) {
      this.$store.dispatch('popupAlert', payload);
    },
    navigateAccount() {
      this.dropdown.settings = false;
      this.$router.push('/account');
    },
    myAccount() {
      this.dropdown.settings = false;
      this.dropdown.languages = false;
      this.$router.push('/account');
    },
    settings() {
      this.dropdown.account = false;
      this.$router.push('/settings');
    },
    about() {
      this.$router.push('/aboutSettings');
    },
    transactions() {
      this.dropdown.settings = false;
      this.$router.push('/transactions');
    },
    topUp() {
      this.dropdown.settings = false;
      this.$router.push('/receive');
    },
    withdraw() {
      this.dropdown.settings = false;
      this.$router.push('/send');
    },
    profile() {
      this.dropdown.settings = false;
      this.$router.push('/account');
    },
    pollData() {
      let triggerOnce = false;
      this.polling = setInterval(async () => {
        if (this.sdk != null && this.isLoggedIn) {
          this.$store.dispatch('updateBalance');
          if (!triggerOnce) {
            this.$store.dispatch('getRegisteredNames');
            triggerOnce = true;
          }
        }
      }, 2500);
    },
    async initSDK() {
      const sdk = await initializeSDK(this, {
        network: this.network,
        current: this.current,
        account: this.account,
        wallet: this.wallet,
        activeAccount: this.activeAccount,
        background: this.background,
      });
      if (typeof sdk != null && !sdk.hasOwnProperty('error')) {
        try {
          await this.$store.commit('SET_TIPPING', await this.$helpers.getContractInstance(TIPPING_CONTRACT, { contractAddress: this.network[this.current.network].tipContract }));
        } catch (e) {}
        this.hideLoader();
      }
      if (typeof sdk.error !== 'undefined') {
        await browser.storage.local.remove('isLogged');
        await browser.storage.local.remove('activeAccount');
        this.hideLoader();
        this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: '', index: 0 });
        this.$store.commit('UNSET_SUBACCOUNTS');
        this.$store.commit('UPDATE_ACCOUNT', '');
        this.$store.commit('SWITCH_LOGGED_IN', false);

        this.$router.push('/');
      }
    },
    initRpcWallet() {
      postMessage(this.background, { type: AEX2_METHODS.INIT_RPC_WALLET, payload: { address: this.account.publicKey, network: this.current.network } });
    },
    hideConnectError() {
      this.connectError = false;
    },
    showConnectError() {
      this.connectError = true
    },
    goBack() {
      if(this.isLoggedIn) {
        this.$router.push('/account')
      } else {
        this.$router.push('/')
      }
    }
  },
  beforeDestroy() {
    clearInterval(this.polling);
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
@import '../common/base';
@import '../common/extension';
@-moz-document url-prefix() {
  html {
    scrollbar-width: none;
  }
  .actions .backbutton .ae-icon {
    vertical-align: middle !important;
  }
  .ae-main { width: 380px; margin:0 auto; }
}
.desktop-right { width: 100%; display: flex; justify-content: space-evenly; }
.desktop-right #account { position: relative; left: 0; top: 0; margin-left: 0; margin-top: 0; }
.ae-header header {
  height: 50px !important
}
.ae-header header .title { display: none; }
html { min-width: 357px; min-height: 600px; background-color: #f5f5f5; }
p { font-weight: bolder; margin-left: 3px; }
input { background: transparent; border: none; border-bottom: 1px; height: 25px; line-height: 25px; }
input:focus { border-bottom: 1px solid #DDD; }
button:focus { outline: none; }
button { background: none; border: none; color: #717C87; cursor: pointer; transition: all 0.2s; }
.pageTitle { margin: 0 0 10px; }
.ae-header { margin-bottom: 0 !important; }
.ae-header.logged { background: $bg-color; box-shadow: #000000 0px 2px 3px; height: 50px; }
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
#account .ae-dropdown-button .dropdown-button-name { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subAccountInfo { margin-right:auto; margin-bottom:0 !important; max-width: 155px; }
#network .subAccountInfo { max-width: 195px; }
.subAccountIcon, .identicon { margin-right: 10px; }
.ae-identicon.base { height: 100% !important; width: 100% !important;}
.subAccountName { text-align: left; color: #000; text-overflow: ellipsis; overflow: hidden; font-weight:bold; margin-bottom:0 !important; white-space: nowrap; }
.subAccountBalance { font-family: monospace; margin-bottom:0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;}
.name-pending { width:24px !important; height:24px !important; margin-right:5px; font-size:.8rem; }
#account .subAccountCheckbox { float: right; }
// #account li, #network li { padding:0.75rem; cursor:pointer !important; }
// #account ul { width:250px; margin-left: -125px; max-height: 350px; height: auto; overflow-y: scroll;}
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
#settings.dropdown ul, #account.dropdown ul  { min-width: 200px }
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
.dropdown .dropdown-button-icon { font-size: 2.5rem; height: 100%;}
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

.actions {
  text-align: left;
}
.actions .backbutton {
  padding: 0;
  color: #9d3fc0 !important;
}
.token-image {
  margin-right: 1rem;
  width: 28px;
}
.tokenBalance {
  margin-right: auto;
}
#tokens .ae-check-button:before {
  width: 20px !important;
  height: 20px !important;
}
#tokens .ae-check-button:after {
  width: 26px !important;
  height: 25px !important;
}
.connect-error {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $primary-color;
  color: #fff;
  padding: 0.3rem;
  text-align: center;
  font-weight: bold;
}
</style>
