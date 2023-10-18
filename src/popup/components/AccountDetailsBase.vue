<template>
  <div class="account-details">
    <div class="account-info-wrapper">
      <slot
        v-if="$slots['account-info']"
        name="account-info"
      />
      <AccountInfo
        v-else
        :account="activeAccount"
        can-copy-address
        show-protocol-icon
      />
      <BtnClose
        class="close-button"
        @click="close"
      />
    </div>
    <div>
      <slot
        v-if="$slots.balance"
        name="balance"
      />
      <BalanceInfo
        v-else
        :balance="balanceNumeric"
        :protocol="activeAccount.protocol"
        horizontal-offline-message
      />

      <div class="buttons">
        <template v-if="!withoutDefaultButtons">
          <OpenTransferReceiveModalButton />
          <OpenTransferSendModalButton />
        </template>
        <slot
          v-if="$slots.buttons"
          name="buttons"
        />
      </div>

      <div
        ref="headerEl"
        class="header"
      >
        <slot name="navigation" />

        <TransactionAndTokenFilter
          :key="routeName!"
          :show-filters="isScrollEnabled"
        />
      </div>

      <div
        class="tabs-content"
        :style="{ height: routerHeight || '350px' }"
      >
        <!-- We are disabling animations on FF because of a bug that causes flickering
          see: https://github.com/ionic-team/ionic-framework/issues/26620 -->
        <IonRouterOutlet
          :animated="!IS_FIREFOX"
          :animation="fadeAnimation"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IonRouterOutlet, useIonRouter } from '@ionic/vue';
import { StatusBar } from '@capacitor/status-bar';
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { IS_MOBILE_APP, IS_FIREFOX } from '@/constants';

import {
  useAccounts,
  useBalances,
  useTransactionAndTokenFilter,
  useUi,
  useScrollConfig,
} from '@/composables';
import OpenTransferReceiveModalButton from '@/popup/components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '@/popup/components/OpenTransferSendModalButton.vue';
import BalanceInfo from '@/popup/components/BalanceInfo.vue';
import AccountInfo from '@/popup/components/AccountInfo.vue';
import BtnClose from '@/popup/components/buttons/BtnClose.vue';
import TransactionAndTokenFilter from '@/popup/components/TransactionAndTokenFilter.vue';
import { popOutAnimation, fadeAnimation } from '@/popup/animations';

export default defineComponent({
  name: 'AccountDetailsBase',
  components: {
    AccountInfo,
    BalanceInfo,
    OpenTransferSendModalButton,
    OpenTransferReceiveModalButton,
    TransactionAndTokenFilter,
    BtnClose,
    IonRouterOutlet,
  },
  props: {
    withoutDefaultButtons: Boolean,
  },
  setup() {
    const route = useRoute();
    const ionRouter = useIonRouter();

    const { activeAccount } = useAccounts();
    const { resetFilter } = useTransactionAndTokenFilter();
    const { isScrollEnabled } = useScrollConfig();
    const { homeRouteName } = useUi();
    const { balance } = useBalances();

    const routerHeight = ref<string>();
    const headerEl = ref<HTMLDivElement>();

    const balanceNumeric = computed(() => balance.value.toNumber());
    const routeName = computed(() => route.name);

    function calculateRouterHeight() {
      const ionicWrapperBottom = document.querySelector('#app-wrapper')?.getBoundingClientRect()?.bottom;
      const headerElementBottom = headerEl.value?.getBoundingClientRect()?.bottom;
      const routerContent = Math.ceil(ionicWrapperBottom! - headerElementBottom!);
      routerHeight.value = `${routerContent}px`;
    }

    function close() {
      ionRouter.navigate({ name: homeRouteName.value }, 'back', 'push', popOutAnimation);
    }

    /**
     * Observe tab height changes and recalculate router height.
     * Tabs change height when filters are shown/hidden
     */
    function observeTabsHeight() {
      const resizeObserver = new ResizeObserver(() => {
        calculateRouterHeight();
      });
      resizeObserver.observe(headerEl.value!);
    }

    watch(
      () => route,
      () => {
        resetFilter();
      },
    );

    onMounted(() => {
      if (IS_MOBILE_APP) {
        StatusBar.setBackgroundColor({
          color: '#191919',
        });
      }
      setTimeout(() => {
        observeTabsHeight();
        calculateRouterHeight();
      }, 250);
    });

    onBeforeUnmount(() => {
      if (IS_MOBILE_APP) {
        StatusBar.setBackgroundColor({
          color: '#141414',
        });
      }
    });

    return {
      close,
      headerEl,
      homeRouteName,
      routeName,
      balanceNumeric,
      activeAccount,
      routerHeight,
      isScrollEnabled,
      fadeAnimation,
      IS_FIREFOX,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';
@use '../../styles/typography';

.account-details {
  --account-info-height: 120px;
  --screen-padding-x: 12px;
  --screen-bg-color: #{variables.$color-bg-modal};
  --header-height: 64px;

  position: relative;
  top: env(safe-area-inset-top);
  background-color: variables.$color-bg-4;
  border-radius: variables.$border-radius-app;
  min-height: 100%;
  height: 100%;
  font-weight: 500;
  color: variables.$color-white;
  box-shadow: 0 0 0 1px variables.$color-border, 0 0 50px rgba(variables.$color-black, 0.6);

  @include mixins.mobile {
    min-height: 100vh;
  }

  .account-info-wrapper {
    z-index: 2;
    display: flex;
    justify-content: space-between;
    padding: 8px 6px 6px;
    background-color: var(--screen-bg-color);
    height: var(--header-height);

    .button-plain {
      width: 24px;
      height: 24px;
      position: absolute;
      right: 7px;
      top: 7px;
      color: variables.$color-white;

      svg {
        width: 24px;
      }
    }

    :deep(.account-info .title) {
      justify-content: flex-start;
      word-break: normal;

      @extend %face-sans-16-regular;
    }
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: var(--gap);
    width: 100%;
    margin-top: 20px;
    padding-inline: var(--screen-padding-x);
  }

  .header {
    position: sticky;
    z-index: variables.$z-index-header;
    top: calc(env(safe-area-inset-top) + var(--header-height));
    padding: var(--gap) var(--screen-padding-x);
    background-color: var(--screen-bg-color);
  }

  .tabs-content {
    position: relative;
    padding-inline: var(--screen-padding-x);
  }

  .close-button {
    position: absolute;
    top: 4px;
    right: 8px;
  }
}
</style>
