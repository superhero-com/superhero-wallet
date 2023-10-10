<template>
  <IonApp class="app">
    <IonPage
      id="app-wrapper"
      class="app-wrapper"
      :class="{
        'show-header': showHeader,
        'is-desktop-web': IS_WEB && !IS_MOBILE_DEVICE,
        'is-extension': IS_EXTENSION,
      }"
    >
      <Loader v-if="isLoaderVisible" />
      <button
        v-if="qrScannerOpen"
        id="camera-close-btn"
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

        <!-- We are disabling animations on FF because of a bug that causes flickering
          see: https://github.com/ionic-team/ionic-framework/issues/26620 -->
        <IonRouterOutlet
          :animated="!RUNNING_IN_TESTS && !IS_FIREFOX"
          :class="{ 'show-header': showHeader, 'ios': IS_IOS }"
          class="main"
        />

        <NodeConnectionStatus
          v-if="!modalsOpen.length"
          class="connection-status"
        />

        <Component
          v-bind="props"
          :is="component"
          v-for="({ component, key, props, viewComponentName }) in modalsOpen"
          :key="key"
          :view-component-name="viewComponentName"
        />
      </div>
    </IonPage>
  </IonApp>
</template>

<script lang="ts">
import {
  IonRouterOutlet,
  IonApp,
  IonPage,
} from '@ionic/vue';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { WalletRouteMeta } from '@/types';
import { watchUntilTruthy } from '@/utils';
import {
  APP_LINK_FIREFOX,
  APP_LINK_CHROME,
  IS_WEB,
  IS_IOS,
  IS_MOBILE_DEVICE,
  IS_MOBILE_APP,
  IS_EXTENSION,
  IS_CHROME_BASED,
  IS_FIREFOX,
  NOTIFICATION_DEFAULT_SETTINGS,
  RUNNING_IN_POPUP,
  RUNNING_IN_TESTS,
} from '@/constants';
import {
  useAccounts,
  useConnection,
  useCurrencies,
  useModals,
  useNotifications,
  useUi,
  useViewport,
} from '@/composables';
import { useAeTippingBackend } from '@/protocols/aeternity/composables';
import { useTransferSendHandler } from '@/composables/transferSendHandler';

import Header from '@/popup/components/Header.vue';
import NodeConnectionStatus from '@/popup/components/NodeConnectionStatus.vue';
import Loader from '@/popup/components/Loader.vue';
import Close from '@/icons/close.svg?vue-component';

export default defineComponent({
  name: 'App',
  components: {
    Header,
    NodeConnectionStatus,
    Close,
    IonApp,
    IonRouterOutlet,
    IonPage,
    Loader,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();
    const { getCacheChainNames } = useAeTippingBackend();

    const { watchConnectionStatus } = useConnection();
    const {
      qrScannerOpen,
      isLoaderVisible,
      initVisibilityListeners,
    } = useUi();
    const { modalsOpen } = useModals();
    const { isLoggedIn } = useAccounts({ store });
    const { addWalletNotification } = useNotifications({ store });
    const { loadCoinsData } = useCurrencies({ store, withoutPolling: true });
    const { initViewport } = useViewport();
    const { restore: restoreTransferSendForm } = useTransferSendHandler();

    const innerElement = ref<HTMLDivElement>();

    const isRestored = computed(() => store.state.isRestored);
    const backedUpSeed = computed(() => store.state.backedUpSeed);
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
      // `requestUpdateCheck` does not exists in the `runtime` type
      // because this feature is available only for selected browsers.
      const updateCheck = (browser?.runtime as any)?.requestUpdateCheck;

      if (IS_EXTENSION && updateCheck) {
        const [update] = await updateCheck();
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
      store.commit('setChainNames', await getCacheChainNames());
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

    onBeforeMount(async () => {
      if (IS_MOBILE_APP) {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({
          color: '#141414',
        });
      }
    });

    onMounted(async () => {
      setDocumentHeight();
      checkExtensionUpdates();
      initViewport(innerElement.value);

      // Hide splash screen programmatically when app is ready
      // to avoid white screen on app start
      if (IS_MOBILE_APP) {
        setTimeout(() => {
          SplashScreen.hide({
            fadeOutDuration: 300,
          });
        }, 2000);
      }

      watchConnectionStatus();

      restoreTransferSendForm();

      if (!RUNNING_IN_POPUP) {
        Promise.allSettled([
          loadCoinsData(),
          fetchAndSetChainNames(),
          setNotificationSettings(),
        ]);
      }
    });

    return {
      IS_FIREFOX,
      IS_IOS,
      IS_WEB,
      IS_EXTENSION,
      IS_MOBILE_DEVICE,
      RUNNING_IN_TESTS,
      modalsOpen,
      qrScannerOpen,
      showHeader,
      showScrollbar,
      innerElement,
      isLoaderVisible,
    };
  },
});
</script>

<style lang="scss" src="../styles/global.scss"></style>

<style lang="scss" scoped>
@use '../styles/variables';
@use '../styles/typography';
@use '../styles/mixins';

.app {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

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
      margin-top: calc(var(--header-height) + env(safe-area-inset-top));
      padding-bottom: env(safe-area-inset-bottom);
      background-color: var(--screen-bg-color);

      &.ios {
        top: 10px;
      }
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
    }
  }
}
</style>
