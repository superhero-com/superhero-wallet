<template>
  <ae-main :class="aeppPopup ? 'ae-main-popup ae-main-wave' : waveBg ? 'ae-main-wave' : ''">
    <Header v-if="!mainLoading" @toggle-sidebar="showSidebar = !showSidebar" />

    <router-view :key="$route.fullPath" />

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

    <Loader size="big" :loading="mainLoading" />
    <NodeConnectionStatus />
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
import { AEX2_METHODS } from './utils/constants';
import { postMessage } from './utils/connection';
import { fetchAndSetLocale } from './utils/i18nHelper';
import { detectBrowser } from './utils/helper';
import Header from './router/components/Header';
import SidebarMenu from './router/components/SidebarMenu';
import NodeConnectionStatus from './router/components/NodeConnectionStatus';
import Tour from './router/components/Tour';

export default {
  components: {
    Header,
    SidebarMenu,
    NodeConnectionStatus,
    Tour,
  },
  data: () => ({
    showSidebar: false,
  }),
  computed: {
    ...mapGetters([
      'account',
      'current',
      'mainLoading',
      'sdk',
      'isLoggedIn',
      'aeppPopup',
      'notifications',
      'notificationsCounter',
      'backedUpSeed',
      'middleware',
    ]),
    ...mapState(['isRestored']),
    waveBg() {
      return ['/intro', '/popup-sign-tx', '/connect', '/importAccount', '/receive'].includes(
        this.$route.path,
      );
    },
    modals() {
      return this.$store.getters['modals/opened'];
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

    this.checkSdkReady();
    this.$store.dispatch('getCurrencies');

    if (process.env.IS_EXTENSION && detectBrowser() !== 'Firefox') {
      const [update] = await browser.runtime.requestUpdateCheck();
      if (update === 'update_available' && !process.env.RUNNING_IN_TESTS) {
        this.$store.commit('ADD_NOTIFICATION', {
          title: '',
          content: this.$t('pages.account.updateAvailable'),
          route: '',
        });
      }
    }
    if (!this.backedUpSeed) {
      this.$store.commit('ADD_NOTIFICATION', {
        title: '',
        content: `${this.$t('pages.account.youNeedTo')} ${this.$t(
          'pages.account.backup',
        )} ${this.$t('pages.account.yourSeedPhrase')}`,
        route: '/securitySettings',
      });
    }
    if (this.notificationsCounter !== 0)
      this.$store.commit('SET_NOTIFICATIONS_COUNTER', this.notifications.length);
    await this.$watchUntilTruly(() => this.middleware);
    this.$store.dispatch('getRegisteredNames');
  },
  methods: {
    async checkSdkReady() {
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
      const polling = setInterval(async () => {
        if (!this.isLoggedIn) return;
        if (!process.env.RUNNING_IN_TESTS && this.sdk) this.$store.dispatch('updateBalance');
      }, 2500);
      this.$once('hook:beforeDestroy', () => clearInterval(polling));
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
