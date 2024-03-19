<template>
  <IonHeader
    id="header"
    class="header ion-no-border"
  >
    <IonToolbar class="toolbar">
      <div
        class="wrapper"
        :class="{
          'not-logged-in': !isLoggedIn,
        }"
      >
        <div
          v-if="isLoggedIn || titleTruncated"
          class="left"
        >
          <BtnIcon
            v-if="showHeaderNavigation"
            class="icon-btn"
            data-cy="back-arrow"
            :icon="BackIcon"
            @click="back"
          />
          <Component
            :is="isLogoDisabled ? 'div' : 'RouterLink'"
            v-else-if="isLoggedIn"
            :to="isLogoDisabled ? null : { name: homeRouteName }"
            :class="['home-button', { disabled: isLogoDisabled }]"
          >
            <Logo class="home-icon" />
          </Component>
        </div>

        <div
          v-if="showHeaderNavigation"
          class="title"
        >
          <Truncate
            :str="titleTruncated"
            class="text"
          />
        </div>

        <div class="right">
          <BtnClose
            v-if="showHeaderNavigation"
            data-cy="btn-close"
            class="btn-close"
            @click="close"
          />
          <template v-else>
            <NetworkButton />

            <template v-if="isLoggedIn">
              <AppsBrowserBtn v-if="IS_MOBILE_APP || UNFINISHED_FEATURES" />

              <NotificationsIcon />

              <BtnIcon
                :to="{ name: ROUTE_MORE }"
                :icon="ThreeDotsIcon"
                data-cy="page-more"
              />
            </template>
          </template>
        </div>
      </div>
    </IonToolbar>
  </IonHeader>
</template>

<script lang="ts">
import {
  IonHeader,
  IonToolbar,
  useBackButton,
  useIonRouter,
} from '@ionic/vue';
import {
  computed,
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IS_MOBILE_APP, UNFINISHED_FEATURES } from '@/constants';
import type { WalletRouteMeta } from '@/types';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
  ROUTE_MORE,
} from '@/popup/router/routeNames';
import { useAccounts, useUi } from '@/composables';

import Logo from '@/icons/logo-small.svg?vue-component';
import BackIcon from '@/icons/back.svg?vue-component';
import ThreeDotsIcon from '@/icons/three-dots.svg?vue-component';

import Truncate from './Truncate.vue';
import BtnClose from './buttons/BtnClose.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import NotificationsIcon from './NotificationsIcon.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import NetworkButton from './NetworkButton.vue';
import AppsBrowserBtn from './AppsBrowser/AppsBrowserBtn.vue';

export default defineComponent({
  components: {
    NetworkButton,
    AppsBrowserBtn,
    NotificationsIcon,
    BtnClose,
    BtnPlain,
    Logo,
    Truncate,
    BtnIcon,
    IonHeader,
    IonToolbar,
  },
  setup() {
    const route = useRoute();
    const ionRouter = useIonRouter();
    const { t } = useI18n();

    const { homeRouteName } = useUi();
    const { isLoggedIn } = useAccounts();

    const pageTitles: Record<string, () => string> = {
      settings: () => t('pages.titles.settings'),
      language: () => t('pages.titles.language'),
      about: () => t('pages.titles.about'),
      sendTip: () => t('pages.titles.sendTip'),
      claimTips: () => t('pages.claimTips.title'),
      terms: () => t('pages.titles.terms'),
      privacy: () => t('pages.titles.privacy'),
      currency: () => t('pages.titles.currency'),
      notifications: () => t('pages.titles.notifications'),
      auction: () => t('pages.titles.auction'),
      more: () => t('pages.titles.more'),
      networks: () => t('pages.titles.networks'),
      permissionsSettings: () => t('pages.titles.permissionsSettings'),
      permissionsEdit: () => t('pages.titles.permissionsEdit'),
      permissionsAdd: () => t('pages.titles.permissionsAdd'),
      commentNew: () => t('pages.titles.commentNew'),
      donateError: () => t('pages.titles.donateError'),
      address: () => t('pages.titles.address'),
      signMessage: () => t('pages.titles.signMessage'),
      signTransaction: () => t('pages.titles.signTransaction'),
      giftCards: () => t('pages.titles.giftCards'),
      txDetails: () => t('pages.titles.txDetails'),
      tokenDetails: () => t('pages.titles.tokenDetails'),
      coinDetails: () => t('pages.titles.coinDetails'),
      saveErrorsLog: () => t('pages.titles.saveErrorsLog'),
      resetWallet: () => t('pages.resetWallet.title'),
      seedPhrase: () => t('pages.titles.seedPhrase'),
      networkAdd: () => t('pages.titles.networkAdd'),
      networkEdit: () => t('pages.titles.networkEdit'),
      notFound: () => t('pages.titles.notFound'),
      multisigProposalDetails: () => t('pages.titles.multisigProposalDetails'),
    };

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
    );
    const routeMeta = computed(() => route.meta as WalletRouteMeta);
    const showHeaderNavigation = computed(() => !!routeMeta.value?.showHeaderNavigation);
    const isLogoDisabled = computed(() => route.name === ROUTE_ACCOUNT);
    const titleTruncated = computed(
      () => (routeMeta.value?.title && pageTitles[routeMeta.value.title])
        ? pageTitles[routeMeta.value.title]()
        : '',
    );

    function back() {
      const { fullPath, meta } = route;
      const { backRoute } = meta || {};

      if (!isLoggedIn.value) {
        return ionRouter.navigate({ name: currentHomeRouteName.value }, 'back', 'push');
      }

      if (backRoute) {
        // TODO: rewrite back button logic in more unified way
        return ionRouter.navigate(backRoute, 'back', 'push');
      }

      const path = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;

      return ionRouter.navigate(
        path.substr(0, path.lastIndexOf('/')) || { name: currentHomeRouteName.value },
        'back',
        'push',
      );
    }

    function close() {
      ionRouter.navigate({ name: currentHomeRouteName.value }, 'back', 'push');
    }

    useBackButton(1, back);

    return {
      UNFINISHED_FEATURES,
      homeRouteName,
      BackIcon,
      ThreeDotsIcon,
      ROUTE_ACCOUNT,
      ROUTE_MORE,
      IS_MOBILE_APP,
      isLoggedIn,
      showHeaderNavigation,
      isLogoDisabled,
      titleTruncated,
      back,
      close,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.header {
  z-index: variables.$z-index-header;
  height: var(--header-height);

  .toolbar {
    --opacity: 0;
    --min-height: 0;
    --padding-top: 0;
    --padding-bottom: 0;
    --padding-start: 0;
    --padding-end: 0;
  }

  .wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--screen-bg-color);
    padding: 0 8px;
    width: 100%;
    height: var(--header-height);

    @include mixins.mobile {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }

    .left {
      display: flex;

      .home-button {
        &.disabled {
          cursor: default;
        }

        &:not(.disabled) {
          .home-icon {
            cursor: pointer;
          }

          &:hover svg {
            color: variables.$color-primary-hover;
          }

          &:active svg {
            color: variables.$color-primary-hover;
            opacity: 0.9;
          }
        }

        .home-icon {
          width: 32px;
          height: 32px;
          color: variables.$color-primary;
        }
      }
    }

    .right {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .title {
      .text {
        @extend %face-sans-16-medium;

        padding: 0 4px;
        display: flex;
        justify-content: center;
        white-space: nowrap;
        line-height: 24px;
        color: variables.$color-white;
      }

      &:only-child {
        flex-grow: 2;
        margin-left: 8px;
      }
    }

    &.not-logged-in:not(:only-child) {
      .left {
        z-index: 1;
      }

      .title {
        width: 100%;
        position: absolute;
      }
    }

    .home-button + .back {
      margin-left: 22px;
    }
  }
}
</style>
