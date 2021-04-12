<template>
  <div
    id="app"
    :class="{
      'not-rebrand': $route.meta.notRebrand,
      'show-sidebar': showSidebar,
      'show-header': showStatusAndHeader,
      'hide-tab-bar': $route.meta.hideTabBar,
    }"
  >
    <Header v-if="showStatusAndHeader" @toggle-sidebar="showSidebar = !showSidebar" />

    <RouterView
      :class="{ 'show-header': showStatusAndHeader }"
      class="main"
    />

    <transition name="slide">
      <div
        v-if="showSidebar"
        class="menu-overlay"
        data-cy="menu-overlay"
        @click.self="showSidebar = false"
      >
        <SidebarMenu @close="showSidebar = false" />
      </div>
    </transition>

    <NodeConnectionStatus v-if="showStatusAndHeader" />
    <TabBar v-if="isLoggedIn && $route.path !== '/intro'" />
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
import { NOTIFICATION_SETTINGS } from './utils/constants';
import Header from './router/components/Header';
import SidebarMenu from './router/components/SidebarMenu';
import NodeConnectionStatus from './router/components/NodeConnectionStatus';
import TabBar from './router/components/TabBar';

export default {
  components: {
    Header,
    SidebarMenu,
    NodeConnectionStatus,
    TabBar,
  },
  data: () => ({
    showSidebar: false,
  }),
  computed: {
    ...mapGetters(['account', 'isLoggedIn']),
    ...mapState(['isRestored', 'current', 'sdk', 'backedUpSeed', 'notifications']),
    showStatusAndHeader() {
      return !(
        ['/', '/intro'].includes(this.$route.path)
        || this.$route.path.startsWith('/web-iframe-popup')
        || this.$route.params.app
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
    },
  },
};
</script>

<style lang="scss">
@import '../styles/mixins';

body {
  margin: 0;
  background-color: $color-black;
}

html,
body {
  height: 100vh;
}

@include desktop {
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

* {
  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<style lang="scss" scoped>
@import '../styles/typography';
@import '../styles/mixins';

#app {
  position: relative;
  margin: 0 auto;
  width: $extension-width;
  height: 600px;
  overflow: auto;

  @include mobile {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  @include desktop {
    box-shadow: $color-border 0 0 0 1px;
  }

  border-radius: 10px;

  @extend %face-sans-16-regular;

  color: $white-color;

  &.show-sidebar {
    overflow-y: hidden;
  }

  .main {
    @include desktop {
      min-height: 100%;
    }

    @include mobile {
      padding-bottom: 48px;
      padding-bottom: calc(48px + env(safe-area-inset-bottom));
    }
  }

  &.show-header .main {
    padding-top: 48px;
    padding-top: calc(48px + env(safe-area-inset-top));

    @include desktop {
      padding-top: 0;
      min-height: calc(100% - 48px);
      min-height: calc(100% - 48px - env(safe-area-inset-top));
    }
  }

  &.not-rebrand {
    @include mobile {
      overflow: visible;
    }

    .main,
    .popup-aex2 {
      padding-left: 20px;
      padding-right: 20px;
    }

    .main {
      text-align: center;
      font-size: 16px;
      margin: 0 auto;
      position: relative;

      &.transactions,
      &.tokens-preview,
      &.token-details {
        padding-left: 0;
        padding-right: 0;
      }
    }
  }

  .menu-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    @include desktop {
      position: sticky;
      height: 100%;
      display: flex;
      flex-direction: row-reverse;
    }

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

  .tab-bar {
    position: fixed;
    width: 100%;
    bottom: 0;

    @include desktop {
      position: sticky;
    }
  }

  &.hide-tab-bar {
    .main {
      @include mobile {
        padding-bottom: 0;
      }
    }

    .tab-bar {
      display: none;
    }
  }
}
</style>

<style lang="scss" src="../styles/global.scss" />
