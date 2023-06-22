<template>
  <IonApp class="ionic-wrapper">
    <div
      class="app-wrapper"
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

        <ion-router-outlet
          v-slot="{ Component }"

          class="ion-padding main"
          :class="{ 'show-header': showHeader }"
        >
          <Component :is="Component" />
        </ion-router-outlet>
        <NodeConnectionStatus
          v-if="!modalsOpen.length"
          class="connection-status"
        />

        <Component
          v-bind="props"
          :is="component"
          v-for="({ component, key, props }) in modalsOpen"
          :key="key"
        />
      </div>
    </div>
  </IonApp>
</template>

<script lang="ts">
import {
  IonRouterOutlet, IonApp,
} from '@ionic/vue';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
  IS_MOBILE_APP,
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
  useUi,
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
    IonApp,
    IonRouterOutlet,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();

    const { watchConnectionStatus } = useConnection();
    const { initVisibilityListeners } = useUi();
    const { modalsOpen } = useModals();
    const { isLoggedIn } = useAccounts({ store });
    const { addWalletNotification } = useNotifications({ store });
    const { loadAeternityData } = useCurrencies({ withoutPolling: true });
    const { initViewport } = useViewport();

    const innerElement = ref<HTMLDivElement>();

    const isRestored = computed(() => store.state.isRestored);
    const backedUpSeed = computed(() => store.state.backedUpSeed);
    const qrScannerOpen = computed(() => store.state.qrScannerOpen);
    const routeMeta = computed<WalletRouteMeta | undefined>(() => route.meta);
    const showScrollbar = computed(() => routeMeta.value?.showScrollbar);

    const showHeader = computed(() => !(
      RUNNING_IN_POPUP
      || route.params.app // TODO determine if still used
      || routeMeta.value?.hideHeader
    ));

    function setDocumentHeight() {
      document.documentElement.style.setProperty(
        '--height',
        IS_MOBILE_APP && IS_IOS ? '100vh' : '100%',
      );
      if (IS_EXTENSION) {
        document.documentElement.classList.add('is-extension');
      }
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
            text: t('pages.account.updateAvailableText'),
            title: t('pages.account.updateAvailable'),
            buttonLabel: t('pages.notifications.goToStore'),
            path,
          });
        }
      }
    }

    async function setNotificationSettings() {
      await watchUntilTruthy(isRestored);
      if (store.state.notificationSettings.length === 0) {
        store.commit('setNotificationSettings', NOTIFICATION_DEFAULT_SETTINGS);
      }
    }

    async function fetchAndSetChainNames() {
      store.commit('setChainNames', await store.dispatch('getCacheChainNames'));
    }

    watch(isLoggedIn, (val) => {
      if (val && !backedUpSeed.value) {
        addWalletNotification({
          title: t('pages.account.secureYourAccount'),
          text: t('pages.account.seedNotification'),
          buttonLabel: t('pages.account.backupNow'),
          path: '/more/settings/seed-phrase',
          isSeedBackup: true,
        });
      }
    });

    watch(() => route.fullPath, () => {
      if (innerElement.value) {
        innerElement.value.scrollTop = 0;
      }
    });

    initVisibilityListeners();

    onMounted(async () => {
      setDocumentHeight();
      checkExtensionUpdates();
      initViewport(innerElement.value);

      watchConnectionStatus();

      if (!RUNNING_IN_POPUP) {
        Promise.allSettled([
          loadAeternityData(),
          fetchAndSetChainNames(),
          setNotificationSettings(),
        ]);
      }
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

.ionic-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
};

.app-wrapper {
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
    margin-top: var(--header-height);
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
