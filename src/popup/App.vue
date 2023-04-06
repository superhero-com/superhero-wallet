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
      ref="innerElement"
      class="app-inner"
      :class="{ 'styled-scrollbar': showScrollbar }"
    >
      <Header v-if="showHeader" />

      <Transition name="page-transition">
        <RouterView
          :class="{ 'show-header': showHeader }"
          class="main"
        />
      </Transition>

      <NodeConnectionStatus
        v-if="!modalsOpen.length"
        class="connection-status"
      />

      <Component
        :is="component"
        v-for="({ component, key, props }) in modalsOpen"
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
  ref,
  watch,
} from '@vue/composition-api';
import type { WalletRouteMeta } from '../types';
import {
  NOTIFICATION_DEFAULT_SETTINGS,
  APP_LINK_FIREFOX,
  APP_LINK_CHROME,
  watchUntilTruthy,
} from './utils';
import {
  IS_WEB,
  IS_IOS,
  IS_MOBILE_DEVICE,
  IS_CORDOVA,
  IS_EXTENSION,
  IS_CHROME_BASED,
  IS_FIREFOX,
  RUNNING_IN_POPUP,
} from '../lib/environment';
import {
  useAccounts,
  useConnection,
  useCurrencies,
  useModals,
  useNotifications,
  useViewport,
} from '../composables';

import Header from './components/Header.vue';
import NodeConnectionStatus from './components/NodeConnectionStatus.vue';
import Close from '../icons/close.svg?vue-component';

export default defineComponent({
  name: 'App',
  components: {
    Header,
    NodeConnectionStatus,
    Close,
  },
  setup(props, { root }) {
    const { watchConnectionStatus } = useConnection();
    const { modalsOpen } = useModals();
    const { isLoggedIn } = useAccounts({ store: root.$store });
    const { addWalletNotification } = useNotifications({ store: root.$store });
    const { loadAeternityData } = useCurrencies({ withoutPolling: true });
    const { initViewport } = useViewport();

    const innerElement = ref<HTMLDivElement>();

    const isRestored = computed(() => root.$store.state.isRestored);
    const backedUpSeed = computed(() => root.$store.state.backedUpSeed);
    const qrScannerOpen = computed(() => root.$store.state.qrScannerOpen);
    const routeMeta = computed<WalletRouteMeta | undefined>(() => root.$route.meta);
    const showScrollbar = computed(() => routeMeta.value?.showScrollbar);

    const showHeader = computed(() => !(
      RUNNING_IN_POPUP
      || root.$route.params.app // TODO determine if still used
      || routeMeta.value?.hideHeader
    ));

    function setDocumentHeight() {
      document.documentElement.style.setProperty(
        '--height',
        IS_CORDOVA && IS_IOS ? '100vh' : '100%',
      );
    }

    async function checkExtensionUpdates() {
      if (IS_EXTENSION && browser?.runtime?.requestUpdateCheck) {
        const [update] = await browser.runtime.requestUpdateCheck();
        let path = '';
        if (IS_FIREFOX) {
          path = APP_LINK_FIREFOX;
        }
        if (IS_CHROME_BASED) {
          path = APP_LINK_CHROME;
        }
        if (update === 'update_available') {
          addWalletNotification({
            text: root.$t('pages.account.updateAvailableText'),
            title: root.$t('pages.account.updateAvailable'),
            buttonLabel: root.$t('pages.notifications.goToStore'),
            path,
          });
        }
      }
    }

    function setNotificationSettings() {
      if (root.$store.state.notificationSettings.length === 0) {
        root.$store.commit('setNotificationSettings', NOTIFICATION_DEFAULT_SETTINGS);
      }
    }

    watch(isLoggedIn, (val) => {
      if (val && !backedUpSeed.value) {
        addWalletNotification({
          title: root.$t('pages.account.secureYourAccount'),
          text: root.$t('pages.account.seedNotification'),
          buttonLabel: root.$t('pages.account.backupNow'),
          path: '/more/settings/seed-phrase',
          isSeedBackup: true,
        });
      }
    });

    onMounted(async () => {
      setDocumentHeight();
      checkExtensionUpdates();
      initViewport(innerElement.value);

      watchConnectionStatus();

      await watchUntilTruthy(() => isRestored.value);
      setNotificationSettings();

      loadAeternityData();
      root.$store.commit('setChainNames', await root.$store.dispatch('getCacheChainNames'));
    });

    return {
      IS_WEB,
      IS_EXTENSION,
      IS_MOBILE_DEVICE,
      modalsOpen,
      qrScannerOpen,
      showHeader,
      showScrollbar,
      innerElement,
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
    padding-bottom: 0;
    padding-bottom: env(safe-area-inset-bottom);
    padding-top: env(safe-area-inset-top);
    background-color: var(--screen-bg-color);
  }

  .connection-status {
    position: fixed;
    z-index: variables.$z-index-header;
    bottom: 0;
    padding-bottom: env(safe-area-inset-bottom);
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

    .app-inner {
      padding-top: var(--header-height);
    }
  }
}
</style>
