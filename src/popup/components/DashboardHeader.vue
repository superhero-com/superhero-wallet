<template>
  <div class="dashboard-header">
    <div class="left">
      <Component
        :is="isLogoDisabled ? 'div' : 'RouterLink'"
        :to="isLogoDisabled ? null : { name: homeRouteName }"
        :class="{ disabled: isLogoDisabled }"
        class="btn-home"
      >
        <AppLogo class="home-icon" />
      </Component>
    </div>

    <div class="right">
      <NetworkButton />

      <template v-if="isLoggedIn">
        <BtnIcon
          key="btn-wallet-connect"
          data-cy="btn-wallet-connect"
          :icon="WalletConnectLogo"
          :icon-variant="(isOnline && wcSession) ? 'success' : 'default'"
          :dimmed="!isOnline || !wcSession"
          @click="openWalletConnectModal()"
        />

        <AppsBrowserBtn
          v-if="IS_MOBILE_APP || UNFINISHED_FEATURES"
          key="btn-browser"
        />

        <NotificationsIcon
          key="btn-notifications"
        />

        <BtnIcon
          key="btn-more"
          data-cy="page-more"
          :to="{ name: ROUTE_MORE }"
          :icon="ThreeDotsIcon"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import { IS_MOBILE_APP, UNFINISHED_FEATURES, MODAL_WALLET_CONNECT } from '@/constants';
import {
  ROUTE_ACCOUNT,
  ROUTE_MORE,
} from '@/popup/router/routeNames';
import {
  useAccounts,
  useConnection,
  useModals,
  useUi,
  useWalletConnect,
} from '@/composables';

import AppLogo from '@/icons/logo-small.svg?vue-component';
import WalletConnectLogo from '@/icons/wallet-connect.svg?vue-component';
import ThreeDotsIcon from '@/icons/three-dots.svg?vue-component';

import NotificationsIcon from './NotificationsIcon.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import NetworkButton from './NetworkButton.vue';
import AppsBrowserBtn from './AppsBrowser/AppsBrowserBtn.vue';

export default defineComponent({
  components: {
    NetworkButton,
    AppsBrowserBtn,
    NotificationsIcon,
    AppLogo,
    BtnIcon,
  },
  setup() {
    const route = useRoute();

    const { homeRouteName } = useUi();
    const { isOnline } = useConnection();
    const { isLoggedIn } = useAccounts();
    const { openModal } = useModals();
    const { wcSession } = useWalletConnect();

    const isLogoDisabled = computed(() => route.name === ROUTE_ACCOUNT);

    function openWalletConnectModal() {
      return openModal(MODAL_WALLET_CONNECT);
    }

    return {
      UNFINISHED_FEATURES,
      homeRouteName,
      ThreeDotsIcon,
      WalletConnectLogo,
      ROUTE_MORE,
      IS_MOBILE_APP,
      isLoggedIn,
      isLogoDisabled,
      isOnline,
      wcSession,
      openWalletConnectModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $header-default-height;
  padding: 0 8px;

  @include mixins.mobile {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

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
}
</style>
