<template>
  <div class="apps-browser-header">
    <div
      v-if="selectedApp"
      class="left"
    >
      <AccountSelector
        v-model="accountAddress"
        avatar-only
        :options="aeAccountsSelectOptions"
        @update:model-value="onAccountChange"
      />

      <BtnIcon
        class="icon-btn"
        data-cy="back-arrow"
        :icon="BackIcon"
        @click="back"
      />
    </div>

    <div class="title">
      <Truncate
        v-if="!selectedApp"
        :str="$t('pages.titles.appsBrowser')"
        class="text"
      />
      <div
        v-else
        class="host"
      >
        <SecureIcon
          v-if="isSecure"
          class="icon secure-lock"
        />
        {{ selectedAppHost }}
      </div>
    </div>

    <div class="right">
      <BtnIcon
        v-if="selectedApp"
        :icon="ThreeDotsIcon"
        @click="openActions"
      />
      <BtnClose
        data-cy="btn-close"
        class="btn-close"
        @click="close"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  unref,
} from 'vue';
import { useIonRouter } from '@ionic/vue';
import { Encoded } from '@aeternity/aepp-sdk';
import { MODAL_DAPP_BROWSER_ACTIONS, BROWSER_ACTIONS } from '@/constants';
import {
  useAccounts,
  useUi,
  useModals,
} from '@/composables';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
  ROUTE_MORE,
} from '@/popup/router/routeNames';

import { type BrowserActionsResolvedVal } from '@/popup/components/Modals/BrowserActions.vue';

import AccountSelector from '@/popup/components/AccountSelector.vue';
import Truncate from '@/popup/components/Truncate.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import BtnClose from '@/popup/components/buttons/BtnClose.vue';

import SecureIcon from '@/icons/lock.svg?vue-component';
import ThreeDotsIcon from '@/icons/three-dots.svg?vue-component';
import BackIcon from '@/icons/chevron.svg?vue-component';

export default defineComponent({
  components: {
    BtnClose,
    Truncate,
    BtnIcon,
    SecureIcon,
    AccountSelector,
  },
  props: {
    selectedApp: { type: Object, default: null },
    iframe: { type: Object, default: null },
  },
  emits: ['back', 'refresh'],
  setup(props, { emit }) {
    const ionRouter = useIonRouter();
    const { openModal } = useModals();

    const { homeRouteName } = useUi();
    const {
      isLoggedIn,
      activeAccount,
      aeAccountsSelectOptions,
      setActiveAccountByAddress,
    } = useAccounts();

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
    );
    const isSecure = computed(() => props?.selectedApp?.url.startsWith('https://'));
    const selectedAppHost = computed(() => {
      const url = new URL(props?.selectedApp?.url);
      return url?.host;
    });

    const accountAddress = ref(unref(activeAccount.value.address));

    function onAccountChange(address: Encoded.AccountAddress) {
      setActiveAccountByAddress(address);
    }

    function back() {
      emit('back');
    }

    function close() {
      ionRouter.navigate(`/${currentHomeRouteName.value}`, 'back', 'push');
    }

    async function openActions() {
      // eslint-disable-next-line no-useless-catch
      try {
        const value = await openModal<BrowserActionsResolvedVal>(
          MODAL_DAPP_BROWSER_ACTIONS,
          {
            iframe: props.iframe,
            selectedApp: props?.selectedApp,
          },
        );
        if (value?.action === BROWSER_ACTIONS.refresh) {
          emit('refresh');
        }
      } catch (error) {
        throw error;
      }
    }

    return {
      isSecure,
      openActions,
      homeRouteName,
      accountAddress,
      selectedAppHost,
      onAccountChange,
      aeAccountsSelectOptions,
      BackIcon,
      ThreeDotsIcon,
      ROUTE_ACCOUNT,
      ROUTE_MORE,
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

.apps-browser-header {
  --header-height: 40px;

  position: sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  top: 0;
  z-index: $z-index-header;
  height: calc(var(--header-height) + env(safe-area-inset-top));
  background-color: var(--screen-bg-color);
  padding: env(safe-area-inset-top) 8px 0 8px;
  width: 100%;

  @include mixins.mobile {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .left {
    display: flex;
    gap: 4px;
    align-items: center;

    .icon-btn {
      --size: 20px;
      --icon-opacity: 0.5;

      width: 32px;
      height: 32px;
      transform: rotate(180deg);
    }
  }

  .right {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }

  .title {
    .text {
      @extend %face-sans-16-medium;

      padding: 0 8px;
      display: flex;
      justify-content: center;
      white-space: nowrap;
      line-height: 24px;
      color: $color-white;
    }

    .host {
      @extend %face-sans-14-regular;

      display: flex;
      align-items: center;
      gap: 2px;
      color: $color-white;

      .secure-lock {
        height: 17px;
        width: 17px;
        opacity: 0.75;
      }
    }
  }
}
</style>
