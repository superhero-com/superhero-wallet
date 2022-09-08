<template>
  <div
    id="app"
    :class="{
      'not-rebrand': $route.meta.notRebrand,
      'show-header': showStatusAndHeader,
      'hide-tab-bar': $route.meta.hideTabBar,
      'new-ui': $route.meta.newUI,
      'as-modal': $route.meta.asModal,
    }"
  >
    <button
      v-if="qrScannerOpen"
      class="camera-close-button"
    >
      <Close />
    </button>
    <div
      v-show="!qrScannerOpen"
      class="app-inner"
    >
      <Header v-if="showStatusAndHeader" />

      <transition :name="$route.meta.asModal ? 'pop-transition' : 'page-transition'">
        <RouterView
          :class="{ 'show-header': showStatusAndHeader }"
          class="main"
        />
      </transition>

      <NodeConnectionStatus v-if="showStatusAndHeader" />
      <Component
        :is="component"
        v-for="{ component, key, props } in modals"
        :key="key"
        v-bind="props"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { detect } from 'detect-browser';
import { NOTIFICATION_SETTINGS } from './utils/constants';
import Header from './router/components/Header.vue';
import NodeConnectionStatus from './router/components/NodeConnectionStatus.vue';
import Close from '../icons/close.svg?vue-component';

export default {
  components: {
    Header,
    NodeConnectionStatus,
    Close,
  },
  computed: {
    ...mapGetters(['isLoggedIn']),
    ...mapState(['isRestored', 'backedUpSeed', 'qrScannerOpen']),
    showStatusAndHeader() {
      return !(
        this.$route.path === '/'
        || this.$route.path.startsWith('/web-iframe-popup')
        || this.$route.params.app
        || this.$route.meta.hideHeader
      );
    },
    modals() {
      return this.$store.getters['modals/opened'];
    },
  },
  watch: {
    isLoggedIn(val) {
      if (val && !this.backedUpSeed) {
        this.$store.commit('addNotification', {
          text: this.$t('pages.account.seedNotification', [this.$t('pages.account.backup')]),
          path: '/settings/security',
        });
      }
    },
  },
  async mounted() {
    document.documentElement.style.setProperty('--height', process.env.PLATFORM === 'cordova' && window.IS_IOS ? '100vh' : '100%');

    window.addEventListener('online', () => this.$store.commit('setNodeStatus', 'online'));
    window.addEventListener('offline', () => this.$store.commit('setNodeStatus', 'offline'));

    await this.$watchUntilTruly(() => this.isRestored);

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
  --screen-padding-x: 16px;
  --screen-bg-color: #{variables.$color-bg-3};

  @extend %face-sans-16-regular;

  position: relative;
  z-index: 1;
  margin: 0 auto;
  width: variables.$extension-width;
  height: 600px;
  overflow: hidden;
  border-radius: 10px;
  color: variables.$color-white;
  background-color: var(--screen-bg-color);
  transition: background-color 200ms;

  @include mixins.mobile {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  @include mixins.desktop {
    box-shadow: variables.$color-border 0 0 0 1px;
  }

  .camera-close-button {
    position: absolute;
    top: calc(20px + env(safe-area-inset-top));
    right: 20px;
    width: 28px;
    height: 28px;
    z-index: 10;
  }

  .app-inner {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .main {
    padding-bottom: 48px;
    padding-bottom: calc(48px + env(safe-area-inset-bottom));

    @include mixins.desktop {
      min-height: 100%;
      padding-bottom: 0;
    }
  }

  &.show-header {
    --screen-bg-color: #{variables.$color-bg-3};

    &.new-ui {
      background: variables.$color-bg-3-new;
    }

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

  &.new-ui {
    --screen-bg-color: #{variables.$color-bg-3-new};
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

  &.as-modal {
    --screen-bg-color: #{variables.$modal-bg-color};
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
