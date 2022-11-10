<template>
  <div
    id="app"
    :class="{
      'show-header': showHeader,
      'is-desktop-web': IS_WEB && !IS_MOBILE_DEVICE,
      'is-extension': IS_EXTENSION,
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
      <Header v-if="showHeader" />

      <transition :name="$route.meta.asModal ? 'pop-transition' : 'page-transition'">
        <RouterView
          :class="{ 'show-header': showHeader }"
          class="main"
        />
      </transition>

      <NodeConnectionStatus
        v-if="!modals.length"
        class="connection-status"
      />

      <Component
        :is="component"
        v-for="{ component, key, props } in modals"
        :key="key"
        v-bind="props"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  watch,
} from '@vue/composition-api';
import {
  NOTIFICATION_DEFAULT_SETTINGS,
  NODE_STATUS_OFFLINE,
  NODE_STATUS_CONNECTION_DONE,
  watchUntilTruthy,
} from './utils';
import {
  IS_WEB,
  IS_IOS,
  IS_MOBILE_DEVICE,
  IS_CORDOVA,
  IS_EXTENSION,
} from '../lib/environment';
import Header from './components/Header.vue';
import NodeConnectionStatus from './components/NodeConnectionStatus.vue';
import Close from '../icons/close.svg?vue-component';

export default defineComponent({
  components: {
    Header,
    NodeConnectionStatus,
    Close,
  },
  setup(props, { root }) {
    const isLoggedIn = computed(() => root.$store.getters.isLoggedIn);
    const isRestored = computed(() => root.$store.state.isRestored);
    const backedUpSeed = computed(() => root.$store.state.backedUpSeed);
    const qrScannerOpen = computed(() => root.$store.state.qrScannerOpen);

    const showHeader = computed(() => !(
      root.$route.path === '/'
      || root.$route.path.startsWith('/web-iframe-popup')
      || root.$route.params.app
      || root.$route.meta?.hideHeader
    ));

    const modals = computed(() => root.$store.getters['modals/opened']);

    function setDocumentHeight() {
      document.documentElement.style.setProperty(
        '--height',
        IS_CORDOVA && IS_IOS ? '100vh' : '100%',
      );
    }

    async function checkExtensionUpdates() {
      if (IS_EXTENSION && browser?.runtime?.requestUpdateCheck) {
        const [update] = await browser.runtime.requestUpdateCheck();
        if (update === 'update_available') {
          root.$store.commit('addNotification', {
            text: root.$t('pages.account.updateAvailable'),
            path: '',
          });
        }
      }
    }

    function setNotificationSettings() {
      if (root.$store.state.notificationSettings.length === 0) {
        root.$store.commit('setNotificationSettings', NOTIFICATION_DEFAULT_SETTINGS);
      }
    }

    function watchAppNetworkAccess() {
      window.addEventListener('online', () => root.$store.commit('setNodeStatus', NODE_STATUS_CONNECTION_DONE));
      window.addEventListener('offline', () => root.$store.commit('setNodeStatus', NODE_STATUS_OFFLINE));
    }

    watch(isLoggedIn, (val) => {
      if (val && !backedUpSeed.value) {
        root.$store.commit('addNotification', {
          text: root.$t('pages.account.seedNotification', [root.$t('pages.account.backup')]),
          path: '/more/settings/seed-phrase',
        });
      }
    });

    onMounted(async () => {
      setDocumentHeight();
      checkExtensionUpdates();
      watchAppNetworkAccess();

      await watchUntilTruthy(() => isRestored.value);

      setNotificationSettings();
      root.$store.dispatch('fungibleTokens/getAeternityData');
      root.$store.commit('setChainNames', await root.$store.dispatch('getCacheChainNames'));
    });

    return {
      IS_WEB,
      IS_EXTENSION,
      IS_MOBILE_DEVICE,
      modals,
      qrScannerOpen,
      showHeader,
    };
  },
});
</script>

<style lang="scss" src="../styles/global.scss"></style>

<style lang="scss" scoped>
@use '../styles/variables';
@use '../styles/typography';
@use '../styles/mixins';

#app {
  --screen-padding-x: 16px;
  --screen-border-radius: 0;
  --screen-bg-color: #{variables.$color-bg-app};
  --header-height: 0;
  --gap: 12px;

  @extend %face-sans-16-regular;

  position: relative;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  border-radius: var(--screen-border-radius);
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

  .connection-status {
    position: fixed;
    bottom: env(safe-area-inset-bottom);
    left: 0;
    width: 100%;
  }

  &.is-extension,
  &.is-desktop-web {
    width: variables.$extension-width;
    height: variables.$extension-height;
  }

  // Imitate the appearance of the mobile/extension app in a desktop browser
  &.is-desktop-web {
    --screen-border-radius: #{variables.$border-radius-app};

    overflow: hidden;
    box-shadow: variables.$color-border 0 0 0 1px;
    transform: translate(0, 0); // Create custom viewport for fixed elements

    @include mixins.mobile {
      --screen-border-radius: 0;

      width: 100%;
      height: 100%;
      overflow: visible;
      box-shadow: none;
    }
  }

  &.show-header {
    --header-height: 40px;

    .main {
      @include mixins.desktop {
        min-height: calc(100% - var(--header-height));
        min-height: calc(100% - var(--header-height) - env(safe-area-inset-top));
      }
    }
  }
}
</style>
