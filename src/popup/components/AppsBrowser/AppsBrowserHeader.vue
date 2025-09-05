<template>
  <div class="apps-browser-header">
    <div class="left">
      <AccountSelector
        v-model="accountAddress"
        avatar-only
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
        :str="$t('pages.titles.appsBrowser')"
        class="text"
      />
    </div>

    <div class="right">
      <BtnIcon
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
import { MODAL_DAPP_BROWSER_ACTIONS } from '@/constants';
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

import ThreeDotsIcon from '@/icons/three-dots.svg?vue-component';
import BackIcon from '@/icons/chevron.svg?vue-component';

export default defineComponent({
  components: {
    BtnClose,
    Truncate,
    BtnIcon,
    AccountSelector,
  },
  emits: ['back', 'refresh'],
  setup(_, { emit }) {
    const ionRouter = useIonRouter();
    const { openModal } = useModals();

    const { homeRouteName } = useUi();
    const {
      isLoggedIn,
      activeAccount,
      setActiveAccountByAddressAndProtocol,
      getAccountByProtocolAndAddress,
    } = useAccounts();

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
    );

    const accountAddress = ref(unref(activeAccount.value.address));

    function onAccountChange(address: Encoded.AccountAddress) {
      const acc = getAccountByProtocolAndAddress(activeAccount.value.protocol, address);
      if (acc) {
        setActiveAccountByAddressAndProtocol(address, acc.protocol);
      }
    }

    function back() {
      emit('back');
    }

    function close() {
      ionRouter.navigate(`/${currentHomeRouteName.value}`, 'back', 'push');
    }

    async function openActions() {
      const value = await openModal<BrowserActionsResolvedVal>(
        MODAL_DAPP_BROWSER_ACTIONS,
        {},
      );
      if (value?.action) emit('refresh');
    }

    return {
      openActions,
      homeRouteName,
      accountAddress,
      onAccountChange,
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
  }
}
</style>
