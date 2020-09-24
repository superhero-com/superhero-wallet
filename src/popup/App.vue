<template>
  <ae-main
    :class="[
      aeppPopup ? 'ae-main-popup ae-main-wave' : waveBg ? 'ae-main-wave' : '',
      iframe && ($route.path === '/intro' || $route.path === '/') ? 'iframe' : '',
    ]"
  >
    <Header
      v-if="!mainLoading && !(iframe && $route.path === '/intro')"
      @toggle-sidebar="showSidebar = !showSidebar"
    />

    <RouterView />

    <transition name="slide">
      <div
        class="menu-overlay"
        v-if="showSidebar"
        @click.self="showSidebar = false"
        data-cy="menu-overlay"
      >
        <SidebarMenu @closeMenu="showSidebar = false" />
      </div>
    </transition>

    <Loader v-if="mainLoading" type="none" />
    <NodeConnectionStatus v-if="!(iframe && $route.path === '/intro')" />
    <Tour />
    <Component
      :is="component"
      v-for="{ component, key, props } in modals"
      :key="key"
      v-bind="props"
    />
  </ae-main>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { clearInterval, setInterval } from 'timers';
import { detect } from 'detect-browser';
import { IN_FRAME } from './utils/helper';
import { AEX2_METHODS } from './utils/constants';
import { postMessage } from './utils/connection';
import { fetchAndSetLocale } from './utils/i18nHelper';
import Header from './router/components/Header';
import SidebarMenu from './router/components/SidebarMenu';
import NodeConnectionStatus from './router/components/NodeConnectionStatus';
import Tour from './router/components/Tour';
import { EventBus } from './utils/eventBus';

export default {
  components: {
    Header,
    SidebarMenu,
    NodeConnectionStatus,
    Tour,
  },
  data: () => ({
    showSidebar: false,
    polling: null,
    iframe: IN_FRAME,
    aeppPopup: window.RUNNING_IN_POPUP,
  }),
  computed: {
    ...mapGetters(['account']),
    ...mapState([
      'isRestored',
      'current',
      'sdk',
      'backedUpSeed',
      'notifications',
      'isLoggedIn',
      'mainLoading',
    ]),
    waveBg() {
      return ['/intro', '/popup-sign-tx', '/connect', '/importAccount', '/receive'].includes(
        this.$route.path,
      );
    },
    modals() {
      return this.$store.getters['modals/opened'];
    },
  },
  watch: {
    isLoggedIn(val) {
      if (val) this.init();
      else clearInterval(this.polling);
    },
  },
  async created() {
    await this.$watchUntilTruly(() => this.isRestored);
    this.$watch(
      ({ current: { language } }) => [language],
      ([language]) => {
        fetchAndSetLocale(language);
      },
    );

    this.$store.dispatch('getCurrencies');
    if (process.env.IS_EXTENSION && detect().name !== 'firefox') {
      const [update] = await browser.runtime.requestUpdateCheck();
      if (update === 'update_available' && !process.env.RUNNING_IN_TESTS) {
        this.$store.commit('addNotification', {
          title: '',
          content: this.$t('pages.account.updateAvailable'),
          route: '',
        });
      }
    }
    if (!this.backedUpSeed) {
      this.$store.commit('addNotification', {
        title: '',
        content: `${this.$t('pages.account.youNeedTo')} ${this.$t(
          'pages.account.backup',
        )} ${this.$t('pages.account.yourSeedPhrase')}`,
        route: '/securitySettings',
      });
    }

    EventBus.$on('error', async entry => {
      this.$store.dispatch('modals/open', { name: 'error-log', entry }).catch(() => false);
    });
  },
  methods: {
    async init() {
      await this.$watchUntilTruly(() => this.sdk);
      if (!window.RUNNING_IN_POPUP && process.env.IS_EXTENSION) {
        postMessage({
          type: AEX2_METHODS.INIT_RPC_WALLET,
          payload: { address: this.account.publicKey, network: this.current.network },
        });
      }

      this.pollData();
    },
    pollData() {
      this.polling = setInterval(() => {
        if (!process.env.RUNNING_IN_TESTS && this.sdk) this.$store.dispatch('updateBalance');
      }, 2500);
      this.$once('hook:beforeDestroy', () => clearInterval(this.polling));
    },
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
@import '../common/base';
@import '../common/extension';
</style>

<style lang="scss" scoped>
@import '../common/variables';

.ae-main {
  position: relative;
  min-height: 600px;
  margin: 0 auto;
  overflow: visible !important;

  &.ae-main-popup {
    background-color: $bg-color !important;
    padding-top: 0;
  }

  &.ae-main-wave {
    background-position: center bottom !important;
    background-repeat: no-repeat !important;
    background-image: url('../icons/background-big-wave.png') !important;
  }

  padding-top: 50px;
  padding-top: calc(50px + env(safe-area-inset-top));

  &.iframe {
    padding-top: 0;
  }

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

@media screen and (max-width: 380px) {
  .ae-main.ae-main-wave {
    background-position: 100% 100% !important;
  }
}
</style>
