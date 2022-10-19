<template>
  <div
    id="app"
    :class="{
      'show-header': showStatusAndHeader,
      'display-as-mobile-app': displayAsMobileApp,
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
import { watchUntilTruthy } from './utils/helper';
import { NOTIFICATION_DEFAULT_SETTINGS } from './utils/constants';
import {
  IS_IOS,
  IS_ANDROID,
  IS_CORDOVA,
  IS_EXTENSION,
} from '../lib/environment';
import Header from './components/Header.vue';
import NodeConnectionStatus from './components/NodeConnectionStatus.vue';
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
    displayAsMobileApp() {
      return !IS_ANDROID;
    },
  },
  watch: {
    isLoggedIn(val) {
      if (val && !this.backedUpSeed) {
        this.$store.commit('addNotification', {
          text: this.$t('pages.account.seedNotification', [this.$t('pages.account.backup')]),
          path: '/more/settings/seed-phrase',
        });
      }
    },
  },
  async mounted() {
    document.documentElement.style.setProperty(
      '--height',
      IS_CORDOVA && IS_IOS ? '100vh' : '100%',
    );

    window.addEventListener('online', () => this.$store.commit('setNodeStatus', 'online'));
    window.addEventListener('offline', () => this.$store.commit('setNodeStatus', 'offline'));

    await watchUntilTruthy(() => this.isRestored);

    this.setNotificationSettings();

    this.checkExtensionUpdates();

    this.$store.dispatch('fungibleTokens/getAeternityData');
    this.$store.commit('setChainNames', await this.$store.dispatch('getCacheChainNames'));
  },
  methods: {
    setNotificationSettings() {
      if (this.$store.state.notificationSettings.length === 0) {
        this.$store.commit('setNotificationSettings', NOTIFICATION_DEFAULT_SETTINGS);
      }
    },
    async checkExtensionUpdates() {
      if (IS_EXTENSION && browser?.runtime?.requestUpdateCheck) {
        const [update] = await browser.runtime.requestUpdateCheck();
        if (update === 'update_available') {
          this.$store.commit('addNotification', {
            text: this.$t('pages.account.updateAvailable'),
            path: '',
          });
        }
      }
    },
  },
};
</script>

<style lang="scss" src="../styles/global.scss"></style>

<style lang="scss" scoped>
@use '../styles/variables';
@use '../styles/typography';
@use '../styles/mixins';

#app {
  --screen-padding-x: 16px;
  --screen-bg-color: #{variables.$color-bg-app};
  --header-height: 0;
  --gap: 12px;

  @extend %face-sans-16-regular;

  position: relative;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  color: variables.$color-white;
  background-color: var(--screen-bg-color);
  font-family: variables.$font-sans;
  transition: background-color 200ms;

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
    background-color: var(--screen-bg-color);

    @include mixins.desktop {
      min-height: 100%;
      padding-bottom: 0;
    }
  }

  &.display-as-mobile-app {
    width: variables.$extension-width;
    height: 600px;
    overflow: hidden;
    border-radius: variables.$border-radius-app;
    box-shadow: variables.$color-border 0 0 0 1px;

    @include mixins.mobile {
      width: 100%;
      height: 100%;
      overflow: visible;
      box-shadow: none;
    }
  }

  &.show-header {
    --header-height: 40px;

    .main {
      padding-top: var(--header-height);
      padding-top: calc(var(--header-height) + env(safe-area-inset-top));

      @include mixins.desktop {
        padding-top: 0;
        min-height: calc(100% - var(--header-height));
        min-height: calc(100% - var(--header-height) - env(safe-area-inset-top));
      }
    }
  }
}
</style>
