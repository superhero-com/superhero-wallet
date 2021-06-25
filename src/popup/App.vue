<template>
  <div
    id="app"
    :class="{
      'not-rebrand': $route.meta.notRebrand,
      'show-header': showStatusAndHeader,
      'hide-tab-bar': $route.meta.hideTabBar,
    }"
  >
    <Header v-if="showStatusAndHeader" />

    <RouterView
      :class="{ 'show-header': showStatusAndHeader }"
      class="main"
    />

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
import NodeConnectionStatus from './router/components/NodeConnectionStatus';
import TabBar from './router/components/TabBar';

export default {
  components: {
    Header,
    NodeConnectionStatus,
    TabBar,
  },
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
    document.documentElement.style.setProperty('--height', process.env.PLATFORM === 'cordova' && window.IS_IOS ? '100vh' : '100%');
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
@use '../styles/variables';
@use '../styles/mixins';

body {
  margin: 0;
  background-color: variables.$color-black;
}

body.color-bg-3 {
  background-color: variables.$color-bg-3;
}

html,
body {
  height: var(--height);
}

@include mixins.desktop {
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
@use '../styles/variables';
@use '../styles/typography';
@use '../styles/mixins';

#app {
  position: relative;
  margin: 0 auto;
  width: variables.$extension-width;
  height: 600px;
  overflow-x: hidden;

  @include mixins.mobile {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  @include mixins.desktop {
    box-shadow: variables.$color-border 0 0 0 1px;
  }

  border-radius: 10px;

  @extend %face-sans-16-regular;

  color: variables.$color-white;

  .main {
    padding-bottom: 48px;
    padding-bottom: calc(48px + env(safe-area-inset-bottom));

    @include mixins.desktop {
      min-height: 100%;
      padding-bottom: 0;
    }
  }

  &.show-header {
    background: variables.$color-bg-3;

    .main {
      padding-top: 48px;
      padding-top: calc(48px + env(safe-area-inset-top));

      @include mixins.desktop {
        padding-top: 0;
        min-height: calc(100% - 48px);
        min-height: calc(100% - 48px - env(safe-area-inset-top));
      }
    }
  }

  &.not-rebrand {
    @include mixins.mobile {
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

      &.transactions {
        padding-left: 0;
        padding-right: 0;
      }

      &:not(.transactions) ::v-deep .account-switcher {
        margin-left: -20px;
        margin-right: -20px;
      }
    }
  }

  .tab-bar {
    position: fixed;
    width: 100%;
    bottom: 0;

    @include mixins.desktop {
      position: sticky;
    }
  }

  &.hide-tab-bar {
    .main {
      padding-bottom: 0;
    }

    .tab-bar {
      display: none;
    }
  }
}
</style>

<style lang="scss" src="../styles/global.scss" />
