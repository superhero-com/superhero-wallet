<template>
  <ae-main :class="onAccount ? 'ae-main-account' : ''">
    <div class="coronaTitle" :slot="defaulT" v-if="isLoggedIn">
      <span>{{ title || 'Corona Wallet ' }}</span>
    </div>
    <ae-header :class="account.publicKey && isLoggedIn ? 'logged' + (aeppPopup ? ' aeppPopup' : '') : ''" v-if="showNavigation">
      <div class="nav-title" :slot="menuSlot" v-if="!isLoggedIn">
        <p v-if="title" class="flex flex-align-center">
          <Arrow class="arrow-back" @click="goBack" /> <span class="title-text"> {{ title }} </span>
        </p>
      </div>
      <div id="settings" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup" :slot="menuSlot" direction="left" ref="settings">
        <Arrow class="arrow-back mt-9" @click="goBack" v-if="title" />
        <Logo class="dropdown-button-icon mt-9" slot="button" v-else />
      </div>
      <div id="account" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup" :slot="mobileRight" direction="right" ref="account">
        <Bell style="margin: 5px;" />
        <button class="acc-dropdown" v-on:click="toggleDropdown">
          <Hamburger class="dropdown-button-icon" style="padding-top:9px;" />
        </button>
        <transition name="slide">
          <SidebarMenu :open="dropdown.account" @toggleMenu="toggleDropdown" @closeMenu="dropdown.account = false" />
        </transition>
      </div>
    </ae-header>
    <hr style="margin: 0; background: #3a3a47; height: 2px; border: 0;" />
    <router-view :key="$route.fullPath"></router-view>
    <div class="menu-overlay" v-if="dropdown.account" @click="dropdown.account = false"></div>
    <Loader size="big" :loading="mainLoading"></Loader>
    <NodeConnectionStatus />
  </ae-main>
</template>

<script>
import { mapGetters } from 'vuex';
import { clearInterval, setInterval } from 'timers';
import { AEX2_METHODS } from './utils/constants';
import { postMessage, readWebPageDom } from './utils/connection';
import { getCurrencies } from './utils/helper';
import { langs, fetchAndSetLocale } from './utils/i18nHelper';
import Arrow from '../icons/arrow.svg';
import Bell from '../icons/bell.svg';
import Hamburger from '../icons/hamburger.svg';
import Logo from '../icons/logo-small.svg';
import SidebarMenu from './router/components/SidebarMenu';
import NodeConnectionStatus from './router/components/NodeConnectionStatus';

export default {
  components: {
    Arrow,
    Bell,
    Hamburger,
    Logo,
    SidebarMenu,
    NodeConnectionStatus,
  },
  data() {
    return {
      language: '',
      dropdown: {
        network: false,
        settings: false,
        account: false,
        languages: false,
        tokens: false,
      },
      menuSlot: 'mobile-left',
      mobileRight: 'mobile-right',
      defaulT: 'default',
      checkSDKReady: null,
      onAccount: false,
      showNavigation: false,
      title: '',
    };
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
      'sdk',
      'aeppPopup',
      'mainLoading',
      'nodeConnecting',
      'currencies',
    ]),
    extensionVersion() {
      return `v.${process.env.npm_package_version}`;
    },
  },
  watch: {
    $route(to) {
      this.title = to.meta.title || '';
      this.showNavigation = typeof to.meta.navigation !== 'undefined' ? to.meta.navigation : true;
      this.onAccount = to.path === '/account';
    },
  },
  async created() {
    this.title = this.$router.currentRoute.meta.title;
    this.showNavigation = this.$router.currentRoute.meta.navigation;

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
    if (process.env.IS_EXTENSION) {
      readWebPageDom((receiver, sendResponse) => {
        this.$store.commit('SET_TIPPING_RECEIVER', receiver);
        sendResponse({ host: receiver.host, received: true });
      });
    }
    if (!window.RUNNING_IN_POPUP) {
      // init SDK
      this.checkSdkReady();
    } else {
      this.hideLoader();
    }
    this.setMenuSlots();
    window.addEventListener('resize', () => {
      this.setMenuSlots();
    });
    this.getCurrencies();
  },
  mounted: function mounted() {
    this.dropdown.settings = false;
  },
  methods: {
    setMenuSlots() {
      if (window.innerWidth <= 480) {
        this.menuSlot = 'mobile-left';
        this.defaulT = 'default';
        this.mobileRight = 'mobile-right';
      } else {
        this.menuSlot = 'default';
        this.defaulT = 'default';
        this.mobileRight = 'default';
      }
    },
    checkSdkReady() {
      if (!window.RUNNING_IN_POPUP) {
        this.checkSDKReady = setInterval(() => {
          if (this.sdk != null) {
            this.initRpcWallet();
            this.pollData();
            clearInterval(this.checkSDKReady);
          }
        }, 100);
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
    initRpcWallet() {
      postMessage({ type: AEX2_METHODS.INIT_RPC_WALLET, payload: { address: this.account.publicKey, network: this.current.network } });
    },
    goBack() {
      this.$router.push(this.isLoggedIn ? '/account' : '/');
    },
    async getCurrencies() {
      const { currency } = await browser.storage.local.get('currency');
      const currencies = await getCurrencies();
      this.$store.commit('SET_CURRENCIES', currencies);
      this.$store.commit('SET_CURRENCY', {
        currency: currency || this.current.currency,
        currencyRate: currency ? currencies[currency] : currencies[this.current.currency],
      });
    },
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
</style>
