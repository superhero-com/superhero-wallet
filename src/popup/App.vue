<template>
  <IonApp class="app">
    <IonPage
      id="app-wrapper"
      class="app-wrapper"
      :class="{
        'show-header': showHeader,
      }"
    >
      <Loader v-if="isLoaderVisible && !isMobileQrScannerVisible" />
      <QrCodeReaderMobileOverlay />
      <div
        v-show="!isMobileQrScannerVisible"
        class="app-inner"
        :class="{ 'styled-scrollbar': showScrollbar }"
      >
        <Header v-if="showHeader" />

        <!--
          Layer displayed under the password protection modal when content is not visible.
        -->
        <div
          v-if="!IS_MOBILE_APP"
          class="app-unauthenticated-placeholder"
          :class="{ visible: !showRouter }"
          data-cy="app-unauthenticated-placeholder"
        />

        <!--
          We are disabling animations on FF because of a bug that causes flickering
          see: https://github.com/ionic-team/ionic-framework/issues/26620
        -->
        <IonRouterOutlet
          v-show="showRouter"
          :animated="!RUNNING_IN_TESTS && !IS_FIREFOX"
          :class="{ 'show-header': showHeader, ios: IS_IOS }"
          class="main"
        />

        <ConnectionStatus
          v-if="!modalsOpen.length"
          class="connection-status"
        />

        <Component
          v-bind="props"
          :is="component"
          v-for="({
            component, key, props, viewComponentName,
          }) in modalsOpen"
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
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { WalletRouteMeta } from '@/types';
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
  RUNNING_IN_POPUP,
  RUNNING_IN_TESTS,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import {
  useAccounts,
  useAuth,
  useConnection,
  useCurrencies,
  useLanguages,
  useModals,
  useMultisigAccounts,
  useNotifications,
  useUi,
} from '@/composables';
import { useTransferSendHandler } from '@/composables/transferSendHandler';

import Header from '@/popup/components/Header.vue';
import ConnectionStatus from '@/popup/components/ConnectionStatus.vue';
import Loader from '@/popup/components/Loader.vue';
import QrCodeReaderMobileOverlay from '@/popup/components/QrCodeReaderMobileOverlay.vue';

import AppLogo from '@/icons/logo-small.svg?vue-component';

export default defineComponent({
  name: 'App',
  components: {
    Header,
    ConnectionStatus,
    QrCodeReaderMobileOverlay,
    IonApp,
    IonRouterOutlet,
    IonPage,
    Loader,
    AppLogo,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();

    const { isAuthenticated } = useAuth();
    const { watchConnectionStatus } = useConnection();
    const {
      isSeedBackedUp,
      isMobileQrScannerVisible,
      isLoaderVisible,
      initVisibilityListeners,
    } = useUi();
    const { modalsOpen } = useModals();
    const { isLoggedIn } = useAccounts();
    const { addWalletNotification } = useNotifications();
    const { loadCoinsData } = useCurrencies({ pollingDisabled: true });
    const { restoreLanguage } = useLanguages();
    const { restoreTransferSendForm } = useTransferSendHandler();
    const { multisigAccounts } = useMultisigAccounts({ pollingDisabled: true });

    const innerElement = ref<HTMLDivElement>();
    const isRouterReady = ref(false);

    const routeMeta = computed<WalletRouteMeta | undefined>(() => route.meta);

    const showScrollbar = computed(() => routeMeta.value?.showScrollbar);

    const showRouter = computed(() => (
      isAuthenticated.value
      || routeMeta.value?.ifNotAuthOnly
      || routeMeta.value?.ifNotAuth
    ));

    const showHeader = computed(() => (
      !RUNNING_IN_POPUP
      && isRouterReady.value
      && !routeMeta.value?.hideHeader
    ));

    /**
     * Set classes on <html> element to allow CSS to behave differently based on the environment.
     * Used mostly by `env-*` mixins set in `mixins.scss` file.
     */
    function setHtmlEnvironmentClasses() {
      if (IS_MOBILE_APP) {
        document.documentElement.classList.add(
          'is-mobile',
          (IS_IOS) ? 'is-mobile-ios' : 'is-mobile-android',
        );
      } else if (IS_EXTENSION) {
        document.documentElement.classList.add('is-extension');
      } else if (IS_WEB) {
        document.documentElement.classList.add('is-web');
      }
    }

    function setHtmlBrowserClass() {
      if (IS_FIREFOX) {
        document.documentElement.classList.add('is-firefox');
      } else if (IS_CHROME_BASED) {
        document.documentElement.classList.add('is-chrome');
      }
    }

    async function checkExtensionUpdates() {
      // `requestUpdateCheck` does not exist in the `runtime` type
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

    async function verifyBackedUpSeed() {
      if (!isSeedBackedUp.value) {
        addWalletNotification({
          title: t('pages.account.secureYourAccount'),
          text: t('pages.account.seedNotification'),
          buttonLabel: t('pages.account.backupNow'),
          path: '/more/settings/seed-phrase',
          isSeedBackup: true,
        });
      }
    }

    watch(() => route.fullPath, () => {
      if (innerElement.value) {
        innerElement.value.scrollTop = 0;
      }
    });

    // Redirect to account page if no multisig accounts are present
    // only if current page is a multisig page
    watch(
      multisigAccounts,
      (value) => {
        if (!value?.length && routeMeta.value?.isMultisig) {
          router.push({ name: ROUTE_ACCOUNT });
        }
      },
    );

    initVisibilityListeners();

    onBeforeMount(async () => {
      setHtmlEnvironmentClasses();
      setHtmlBrowserClass();

      if (IS_MOBILE_APP) {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({
          color: '#141414',
        });
        window.screen.orientation?.lock?.('portrait');
      }
    });

    onMounted(() => {
      isRouterReady.value = false;
      /**
       * returned value from `useRoute` function will have an empty `meta`
       * field on the initialization, after awaiting for `router.isReady()`
       * correct `meta` info will be presented
       */
      router.isReady().then(() => {
        isRouterReady.value = true;
      });
      checkExtensionUpdates();
      restoreLanguage();
      restoreTransferSendForm();
      watchConnectionStatus();

      // Hide splash screen programmatically when app is ready
      // to avoid white screen on app start
      if (IS_MOBILE_APP) {
        setTimeout(() => {
          SplashScreen.hide({
            fadeOutDuration: 300,
          });
        }, 2000);
      }

      if (!RUNNING_IN_POPUP) {
        loadCoinsData();
      }

      watchUntilTruthy(isLoggedIn).then(() => {
        setTimeout(() => {
          verifyBackedUpSeed();
        }, 100);
      });
    });

    return {
      IS_FIREFOX,
      IS_IOS,
      IS_WEB,
      IS_EXTENSION,
      IS_MOBILE_APP,
      IS_MOBILE_DEVICE,
      RUNNING_IN_TESTS,
      isAuthenticated,
      isLoaderVisible,
      isMobileQrScannerVisible,
      modalsOpen,
      showRouter,
      showHeader,
      showScrollbar,
      innerElement,
    };
  },
});
</script>

<style lang="scss" src="../styles/global.scss"></style>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.app {
  --screen-padding-x: 16px;
  --screen-border-radius: 0;
  --screen-bg-color: #{$color-bg-app};
  --header-height: 0;
  --gap: 12px;

  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  .app-wrapper {
    @extend %text-body;

    position: relative;
    margin: 0 auto;
    width: 100%;
    height: 100vh;
    border-radius: var(--screen-border-radius);
    color: $color-white;
    background-color: var(--screen-bg-color);
    font-family: $font-sans;
    transition: background-color 200ms;

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

    .app-unauthenticated-placeholder {
      position: absolute;
      z-index: $z-index-placeholder;
      inset: 0;
      visibility: hidden;
      opacity: 0;
      background: $color-black url('../image/wallet-locked-bg.svg');
      background-size: cover;
      transition: all 0.5s ease-in-out;
      transform: scale(1.1);
      will-change: opacity, transform;

      &.visible {
        visibility: visible;
        opacity: 1;
        transform: scale(1);
      }
    }

    .connection-status {
      position: fixed;
      z-index: $z-index-header;
      bottom: 0;
      padding-bottom: env(safe-area-inset-bottom);
      left: 0;
      width: 100%;
    }

    &.show-header {
      --header-height: 40px;
    }
  }

  @include mixins.env-mobile-ios {
    height: 100vh;
  }

  // Setting the extension popup window size
  @include mixins.env-extension {
    min-width: $extension-width;
    min-height: $extension-height;
    max-width: $phone-width;
  }

  // Temporary fix for the issue that was introduced by Firefox v129.0.1.
  // FF was not able to use the `min-height` property to establish the app size.
  // @TODO maybe future versions of FF will fix this so this block can be removed.
  @at-root html.is-extension.is-firefox & {
    height: $extension-height;
  }

  @include mixins.env-web {
    // Imitate the appearance of the mobile/extension app by displaying it in a box
    // TODO consider full-screen
    @include mixins.desktop {
      --screen-border-radius: #{$border-radius-app};

      width: $extension-width;
      height: $extension-height;

      .app-wrapper {
        overflow: hidden;
        box-shadow: $color-border 0 0 0 1px;
        transform: translate(0, 0); // Create custom viewport for fixed elements
      }
    }
  }
}
</style>
