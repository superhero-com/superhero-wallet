<template>
  <div
    class="page-header"
    :class="{
      'not-logged-in': !isLoggedIn,
    }"
  >
    <div
      v-if="isLoggedIn || text"
      class="left"
    >
      <BtnIcon
        class="icon-btn"
        data-cy="back-arrow"
        :icon="BackIcon"
        @click="back"
      />
    </div>

    <div
      class="title"
    >
      <Truncate
        :str="text"
        class="text"
      />
    </div>

    <div class="right">
      <BtnClose
        key="btn-close"
        data-cy="btn-close"
        class="btn-close"
        @click="close"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  useBackButton,
  useIonRouter,
} from '@ionic/vue';
import {
  computed,
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import { IS_MOBILE_APP } from '@/constants';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
  ROUTE_MORE,
} from '@/popup/router/routeNames';
import {
  useAccounts,
  useUi,
} from '@/composables';

import BackIcon from '@/icons/back.svg?vue-component';

import Truncate from './Truncate.vue';
import BtnClose from './buttons/BtnClose.vue';
import BtnIcon from './buttons/BtnIcon.vue';

export default defineComponent({
  components: {
    BtnClose,
    Truncate,
    BtnIcon,
  },
  props: {
    text: { type: String, default: null },
  },
  setup() {
    const route = useRoute();
    const ionRouter = useIonRouter();

    const { homeRouteName } = useUi();
    const { isLoggedIn } = useAccounts();

    // const pageTitles: Record<string, () => string> = {
    //   language: () => t('pages.titles.language'),
    //   sendTip: () => t('pages.titles.sendTip'),
    //   privacy: () => t('pages.titles.privacy'),
    //   currency: () => t('pages.titles.currency'),
    //   auction: () => t('pages.titles.auction'),
    //   networks: () => t('pages.titles.networks'),
    //   permissionsSettings: () => t('pages.titles.permissionsSettings'),
    //   permissionsEdit: () => t('pages.titles.permissionsEdit'),
    //   permissionsAdd: () => t('pages.titles.permissionsAdd'),
    //   commentNew: () => t('pages.titles.commentNew'),
    //   donateError: () => t('pages.titles.donateError'),
    //   address: () => t('pages.titles.address'),
    //   signMessage: () => t('pages.titles.signMessage'),
    //   signTransaction: () => t('pages.titles.signTransaction'),
    //   saveErrorsLog: () => t('pages.titles.saveErrorsLog'),
    //   resetWallet: () => t('pages.resetWallet.title'),
    //   seedPhrase: () => t('pages.titles.seedPhrase'),
    //   networkAdd: () => t('pages.titles.networkAdd'),
    //   networkEdit: () => t('pages.titles.networkEdit'),
    //   notFound: () => t('pages.titles.notFound'),
    //   multisigProposalDetails: () => t('pages.titles.multisigProposalDetails'),
    //   secureLogin: () => t('pages.titles.secureLogin'),
    //   addressBookEdit: () => t('pages.titles.addressBookEdit'),
    //   addressBookAdd: () => t('pages.titles.addressBookAdd'),
    // };

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
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
      ROUTE_ACCOUNT,
      ROUTE_MORE,
      IS_MOBILE_APP,
      homeRouteName,
      BackIcon,
      isLoggedIn,
      back,
      close,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $header-default-height;
  padding: 0 8px;

  .left {
    display: flex;

    .btn-home {
      &.disabled {
        cursor: default;
      }

      &:not(.disabled) {
        .home-icon {
          cursor: pointer;
        }

        &:hover svg {
          color: $color-primary-hover;
        }

        &:active svg {
          color: $color-primary-hover;
          opacity: 0.9;
        }
      }

      .home-icon {
        width: 32px;
        height: 32px;
        color: $color-primary;
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
      color: $color-white;
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

  .btn-home + .back {
    margin-left: 22px;
  }
}
</style>
