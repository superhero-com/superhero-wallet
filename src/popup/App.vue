<template>
  <ae-main :class="aeppPopup ? 'ae-main-popup ae-main-wave' : waveBg ? 'ae-main-wave' : ''" :style="waveBg ? { 'background-image': `url(${wave_bg}) !important` } : {}">
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
  }),
  computed: {
    ...mapGetters(['account', 'current', 'mainLoading', 'sdk', 'isLoggedIn', 'aeppPopup']),
    waveBg() {
      return ['/intro', '/popup-sign-tx', '/connect', '/importAccount', '/receive'].includes(this.$route.path);
    },
  },
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

    this.checkSdkReady();
    this.getCurrencies();

    if (await this.$store.dispatch('checkExtensionUpdate')) {
      this.$store.commit('ADD_NOTIFICATION', { title: '', content: this.$t('pages.account.updateExtension') });
    }
    if (!(await this.$store.dispatch('checkBackupSeed'))) {
      this.$store.commit('ADD_NOTIFICATION', {
        title: '',
        content: `${this.$t('pages.account.youNeedTo')} ${this.$t('pages.account.backup')} ${this.$t('pages.account.yourSeedPhrase')}`,
      });
    }
  },
  methods: {
    checkSdkReady() {
      const checkSDKReady = setInterval(() => {
        if (this.sdk !== null) {
          if (!window.RUNNING_IN_POPUP) {
            postMessage({ type: AEX2_METHODS.INIT_RPC_WALLET, payload: { address: this.account.publicKey, network: this.current.network } });
          }
          this.pollData();
          clearInterval(checkSDKReady);
        }
      }, 100);
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
@import '../common/variables';

.ae-main {
  position: relative;
  max-width: 357px;
  min-height: 600px;
  margin: 0 auto;

  &.ae-main-popup {
    background-color: $bg-color !important;
    padding-top: 0;
  }
  &.ae-main-wave {
    background-position: 100% 100% !important;
    background-repeat: no-repeat !important;
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
