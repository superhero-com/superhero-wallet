<template>
  <div id="app">
    <Header v-if="showHeader" @toggle-sidebar="showSidebar = !showSidebar" />

    <RouterView
      :class="{ 'not-rebrand': $route.meta.notRebrand, 'show-header': showHeader }"
      class="main"
    />

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

    <NodeConnectionStatus v-if="showConnectionStatus" />
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

export default {
  components: {
    Header,
    SidebarMenu,
    NodeConnectionStatus,
  },
  data: () => ({
    showSidebar: false,
  }),
  computed: {
    ...mapGetters(['account', 'isLoggedIn']),
    ...mapState(['isRestored', 'current', 'sdk', 'backedUpSeed', 'notifications']),
    showConnectionStatus() {
      return !(IN_FRAME && this.$route.path === '/intro');
    },
    showHeader() {
      return !window.RUNNING_IN_POPUP && this.showConnectionStatus;
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
  async mounted() {
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
@import '../styles/variables';

html,
body {
  width: $container-width;
  height: 600px;
}

body {
  margin: 0;
  background-color: $color-black;
}

@media screen and (min-width: $container-width) {
  html {
    margin: 0 auto;
  }
}
</style>

<style lang="scss" scoped>
@import '../styles/typography';

#app {
  position: relative;
  margin: 0 auto;
  overflow: visible;

  @extend %face-sans-16-regular;

  color: $white-color;

  .main {
    &.not-rebrand {
      padding: 4px 20px;
      text-align: center;
      font-size: 16px;
      margin: 0 auto;
      position: relative;
    }

    &.show-header {
      padding-top: 48px;
      padding-top: calc(48px + env(safe-area-inset-top));
    }
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
</style>

<style lang="scss" src="../styles/global.scss" />
