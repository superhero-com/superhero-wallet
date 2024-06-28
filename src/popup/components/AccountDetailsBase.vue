<template>
  <div
    class="account-details"
    :data-account-address="activeAccount.address"
  >
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
        data-cy="btn-close"
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
          <OpenTransferReceiveModalBtn />
          <OpenTransferSendModalBtn />
          <OpenShareAddressModalBtn
            :address="activeAccount.address"
            :protocol="activeAccount.protocol"
          />
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
          :show-all-filter-options="activeAccount.protocol === PROTOCOLS.aeternity"
          :show-filters="isScrollEnabled"
        />
      </div>

      <div
        class="tabs-content"
        :style="{ height: routerHeight || `${INITIAL_TABS_HEIGHT}px` }"
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
} from 'vue';
import { useRoute } from 'vue-router';
import { IS_MOBILE_APP, IS_FIREFOX, PROTOCOLS } from '@/constants';

import {
  useAccounts,
  useBalances,
  useUi,
  useScrollConfig,
} from '@/composables';
import { popOutAnimation, fadeAnimation } from '@/popup/animations';

import OpenTransferSendModalBtn from '@/popup/components/OpenTransferSendModalBtn.vue';
import BalanceInfo from '@/popup/components/BalanceInfo.vue';
import AccountInfo from '@/popup/components/AccountInfo.vue';
import BtnClose from '@/popup/components/buttons/BtnClose.vue';
import TransactionAndTokenFilter from '@/popup/components/TransactionAndTokenFilter.vue';
import OpenTransferReceiveModalBtn from '@/popup/components/OpenTransferReceiveModalBtn.vue';
import OpenShareAddressModalBtn from '@/popup/components/OpenShareAddressModalBtn.vue';

const INITIAL_TABS_HEIGHT = 330;

export default defineComponent({
  name: 'AccountDetailsBase',
  components: {
    AccountInfo,
    BalanceInfo,
    OpenTransferSendModalBtn,
    OpenShareAddressModalBtn,
    OpenTransferReceiveModalBtn,
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
    const { isScrollEnabled } = useScrollConfig();
    const { homeRouteName } = useUi();
    const { balance } = useBalances();

    const routerHeight = ref<string>();
    const headerEl = ref<HTMLDivElement>();
    const resizeObserver = ref<ResizeObserver>();

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
      resizeObserver.value = new ResizeObserver(calculateRouterHeight);
      resizeObserver.value.observe(headerEl.value!);
    }

    onMounted(() => {
      observeTabsHeight();
      // The timeout ensures that the height is calculated correctly in some edge cases
      setTimeout(() => {
        calculateRouterHeight();
      }, 150);

      if (IS_MOBILE_APP) {
        StatusBar.setBackgroundColor({
          color: '#191919',
        });
      }
    });

    onBeforeUnmount(() => {
      resizeObserver.value?.disconnect();
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
      INITIAL_TABS_HEIGHT,
      PROTOCOLS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.account-details {
  --account-info-height: 120px;
  --screen-padding-x: 12px;
  --screen-bg-color: #{$color-bg-modal};
  --header-height: 64px;

  position: relative;
  top: env(safe-area-inset-top);
  background-color: $color-bg-4;
  border-radius: $border-radius-app;
  min-height: 100%;
  height: 100%;
  font-weight: 500;
  color: $color-white;
  box-shadow: 0 0 0 1px $color-border, 0 0 50px rgba($color-black, 0.6);

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
      color: $color-white;

      svg {
        width: 24px;
      }
    }
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: var(--gap);
    width: 100%;
    margin-top: 20px;
    padding-inline: var(--screen-padding-x);

    &:has(> :nth-child(5)) { // 5 or more buttons
      overflow: auto;
      white-space: nowrap;

      > * {
        min-width: 84px;
      }
    }

  }

  .header {
    position: sticky;
    z-index: $z-index-header;
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
