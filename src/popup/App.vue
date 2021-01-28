<template>
  <div
    :class="[
      'ae-main',
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
        <SidebarMenu @close="showSidebar = false" />
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
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { detect } from 'detect-browser';
import { IN_FRAME } from './utils/helper';
import { AEX2_METHODS, NOTIFICATION_SETTINGS } from './utils/constants';
import { postMessage } from './utils/connection';
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
      return ['/intro', '/popup-sign-tx', '/connect', '/import-account', '/receive'].includes(
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
    },
  },
  async created() {
    await this.$watchUntilTruly(() => this.isRestored);

    this.$store.dispatch('getCurrencies');
    this.$store.dispatch('fungibleTokens/getAeternityData');
    if (process.env.IS_EXTENSION && detect().name !== 'firefox') {
      const [update] = await browser.runtime.requestUpdateCheck();
      if (update === 'update_available' && !process.env.RUNNING_IN_TESTS) {
        this.$store.commit('addNotification', {
          text: this.$t('pages.account.updateAvailable'),
          path: '',
        });
      }
    }
    if (this.$store.state.notificationSettings.length === 0) {
      this.$store.commit('setNotificationSettings', NOTIFICATION_SETTINGS);
    }

    this.$store.commit('setChainNames', await this.$store.dispatch('getCacheChainNames'));

    EventBus.$on('error', async (entry) => {
      this.$store.dispatch('modals/open', { name: 'error-log', entry }).catch(() => false);
    });
  },
  methods: {
    async init() {
      if (!this.backedUpSeed) {
        this.$store.commit('addNotification', {
          text: this.$t('pages.account.seedNotification', [this.$t('pages.account.backup')]),
          path: '/settings/security',
        });
      }
      await this.$watchUntilTruly(() => this.sdk);
      if (!window.RUNNING_IN_POPUP && process.env.IS_EXTENSION) {
        postMessage({
          type: AEX2_METHODS.INIT_RPC_WALLET,
          payload: this.current.network,
        });
      }
    },
  },
};
</script>

<style lang="scss">
html {
  height: 100%;
}

body {
  min-height: 100%;
  height: 1px;
}
</style>

<style lang="scss" scoped>
@import '../styles/variables';

.ae-main {
  position: relative;
  min-height: 600px;
  margin: 0 auto;
  overflow: visible;

  &.ae-main-popup {
    background-color: $bg-color;
    padding-top: 0;
  }

  &.ae-main-wave {
    height: 100%;
    background-position: center bottom;
    background-repeat: no-repeat;
    background-image: url('../icons/background-big-wave.png');
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
    background-position: 100% 100%;
  }
}
</style>

<style lang="scss" src="../styles/global.scss" />
