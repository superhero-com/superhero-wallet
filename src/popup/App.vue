<template>
  <ae-main :class="onAccount ? 'ae-main-account' : ''">
    <Header  v-if="showNavigation" :title="title" />
    <hr style="margin: 0; background: #3a3a47; height: 2px; border: 0;" />
    <router-view :key="$route.fullPath"></router-view>
    
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
import NodeConnectionStatus from './router/components/NodeConnectionStatus';
import Header from './router/components/Header';

export default {
  components: {
    NodeConnectionStatus,
    Header
  },
  data() {
    return {
      language: '',
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
      'activeNetwork',
      'balance',
      'sdk',
      'mainLoading',
      'nodeConnecting',
      'currencies',
    ]),
    extensionVersion() {
      return `v.${process.env.npm_package_version}`;
    },
  },
  watch: {
    $route(to, from) {
      this.title = to.meta.title || '';
      this.showNavigation = typeof to.meta.navigation !== 'undefined' ? to.meta.navigation : true;
      if (to.path == '/account') {
        this.onAccount = true;
      } else {
        this.onAccount = false;
      }
    },
  },
  async created() {
    this.title = this.$router.currentRoute.meta.title;
    this.showNavigation = this.$router.currentRoute.meta.navigation;

    browser.storage.local.get('language').then(data => {
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
    }
    this.getCurrencies();
  },
  methods: {
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
