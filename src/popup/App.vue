<template>
  <ae-main :class="$route.path === '/receive' ? 'ae-main-receive' : ''">
    <div class="background-big-wave" :style="$route.path === '/intro' ? { 'z-index': '0', 'background-image': 'url(' + wave_bg + ') !important' } : ''"></div>
    <Header @toggle-sidebar="showSidebar = !showSidebar" />

    <router-view :key="$route.fullPath" />

    <transition name="slide">
      <div class="menu-overlay" v-if="showSidebar" @click.self="showSidebar = false">
        <SidebarMenu @closeMenu="showSidebar = false" />
      </div>
    </transition>

    <Loader size="big" :loading="mainLoading" />
    <NodeConnectionStatus />
  </ae-main>
</template>

<script>
import { mapGetters } from 'vuex';
import { clearInterval, setInterval } from 'timers';
import { AEX2_METHODS } from './utils/constants';
import { postMessage, readWebPageDom } from './utils/connection';
import { getCurrencies } from './utils/helper';
import { fetchAndSetLocale } from './utils/i18nHelper';
import Header from './router/components/Header';
import SidebarMenu from './router/components/SidebarMenu';
import NodeConnectionStatus from './router/components/NodeConnectionStatus';

export default {
  components: {
    Header,
    SidebarMenu,
    NodeConnectionStatus,
  },
  data: () => ({
    wave_bg: browser.runtime.getURL('../icons/background-big-wave.png'),
    showSidebar: false,
    checkSDKReady: null,
  }),
  computed: mapGetters(['account', 'current', 'mainLoading', 'sdk', 'isLoggedIn']),
  async created() {
    const { language, activeNetwork } = await browser.storage.local.get(['language', 'activeNetwork']);

    this.$store.state.current.language = language;
    if (language) fetchAndSetLocale(language);

    if (activeNetwork) {
      this.$store.state.current.network = activeNetwork;
    }

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

<style lang="scss" scoped>
*:not(.background-big-wave) {
  z-index: 1;
}
.background-big-wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  top: 0;
  background: transparent;
  background-position-y: bottom;
  background-position-x: right;
  background-repeat: no-repeat;
}
.ae-main {
  &.ae-main-receive {
    background: #1d1d25 !important;
    min-height: 600px;
  }

  padding-top: 50px;
  padding-top: calc(50px + env(safe-area-inset-top));

  .menu-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(#000, 0.6);
    z-index: 10;
  }

  .slide-enter-active,
  .slide-enter-active .sidebar-menu,
  .slide-leave-active,
  .slide-leave-active .sidebar-menu {
    transition-property: right, opacity;
    transition-duration: 0.3s;
    transition-timing-function: ease;
  }
  .slide-leave-active,
  .slide-leave-active .sidebar-menu {
    transition-duration: 0.2s;
  }
  .slide-enter .sidebar-menu,
  .slide-leave-to .sidebar-menu {
    right: -200px;
  }
  .slide-leave-to .sidebar-menu {
    opacity: 0;
  }
}
</style>
