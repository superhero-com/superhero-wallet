<template>
  <div
    ref="accountDetailsElem"
    class="account-details"
  >
    <div class="account-info-wrapper">
      <AccountInfo
        :account-idx="activeIdx"
        can-copy-address
      />

      <BtnClose
        class="close-button"
        :to="{ name: 'account' }"
      />
    </div>
    <div>
      <BalanceInfo :account-idx="activeIdx" />

      <div class="buttons">
        <BtnBox
          v-for="(action, index) in actions"
          :key="index"
          :disabled="action.disabled"
          @click="action.onClick"
        >
          <Component :is="action.icon" />
          <div>{{ action.text }}</div>
        </BtnBox>
      </div>

      <div class="header">
        <AccountDetailsNavigation />
        <TransactionAndTokenFilter
          :key="routeName"
          :show-filters="showFilters"
        />
      </div>

      <div class="tabs-content">
        <transition
          name="fade-transition"
          mode="out-in"
        >
          <RouterView />
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import { debounce } from 'lodash-es';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  DEX_URL,
  EXTENSION_HEIGHT,
  buildSimplexLink,
} from '../utils';
import { IS_CORDOVA } from '../../lib/environment';

import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import BtnPlain from '../components/buttons/BtnPlain.vue';
import BtnBox from '../components/buttons/BtnBox.vue';
import BtnClose from '../components/buttons/BtnClose.vue';
import TransactionAndTokenFilter from '../components/TransactionAndTokenFilter.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';

import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import CreditCardIcon from '../../icons/credit-card.svg?vue-component';
import SwapIcon from '../../icons/swap.svg?vue-component';
import { useTransactionAndTokenFilter } from '../../composables';
import BtnPill from '../components/buttons/BtnPill.vue';

export default defineComponent({
  name: 'AccountDetails',
  components: {
    AccountDetailsNavigation,
    BtnPill,
    TransactionAndTokenFilter,
    AccountInfo,
    BalanceInfo,
    BtnPlain,
    BtnBox,
    BtnClose,
  },
  setup(props, { root }) {
    const ACCOUNT_INFO_HEIGHT = 120;
    const BALANCE_AND_ACTIONS_HEIGHT = 280;
    const accountDetailsElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const clientHeight = ref<number>(0);
    const initialClientHeight = ref<number>(EXTENSION_HEIGHT);

    const { resetFilter } = useTransactionAndTokenFilter();

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => accountDetailsElem.value?.parentElement,
    );
    const isConnected = computed(() => root.$store.getters.isConnected);
    const account = computed(() => root.$store.getters.account);
    const activeIdx = computed(() => root.$store.state.accounts.activeIdx);
    const simplexLink = computed(() => buildSimplexLink(account.value.address));
    const showNamesNavigation = computed(() => !!root.$route?.meta?.showNamesNavigation);
    const routeName = computed(() => root.$route.name);

    const actions = computed(() => [
      {
        text: root.$t('pages.token-details.receive'),
        onClick: () => root.$store.dispatch('modals/open', {
          name: MODAL_TRANSFER_RECEIVE,
        }),
        icon: ArrowReceiveIcon,
      },
      {
        text: root.$t('pages.token-details.send'),
        onClick: () => root.$store.dispatch('modals/open', {
          name: MODAL_TRANSFER_SEND,
        }),
        icon: ArrowSendIcon,
        disabled: !isConnected.value,
      },
      {
        text: root.$t('pages.token-details.buy'),
        onClick: () => window.open(simplexLink.value, '_blank'),
        icon: CreditCardIcon,
      },
      {
        text: root.$t('pages.token-details.swap'),
        onClick: () => window.open(DEX_URL, '_blank'),
        icon: SwapIcon,
      },
    ]);

    const showFilters = computed<boolean>(() => (
      clientHeight.value > initialClientHeight.value
      && appInnerScrollTop.value >= ACCOUNT_INFO_HEIGHT
    ));

    const resizeObserver = new ResizeObserver(debounce((entries) => {
      if (!(Array.isArray(entries) && entries.length)) {
        return;
      }
      const newClientHeight = entries[0].target.clientHeight;
      if (
        newClientHeight && (
          (
            clientHeight.value + BALANCE_AND_ACTIONS_HEIGHT + ACCOUNT_INFO_HEIGHT
          ) < newClientHeight
          || newClientHeight <= initialClientHeight.value
        )
      ) {
        clientHeight.value = newClientHeight;
      }
    }, 100));

    watch(
      () => root.$route,
      () => {
        clientHeight.value = 0;
        resetFilter();
      },
    );

    onMounted(() => {
      if (IS_CORDOVA) {
        window.StatusBar.backgroundColorByHexString('#191919');
      }
      if (accountDetailsElem.value && appInnerElem.value) {
        resizeObserver.observe(accountDetailsElem.value);
        initialClientHeight.value = appInnerElem.value.clientHeight;
        appInnerElem.value.addEventListener('scroll', () => {
          appInnerScrollTop.value = accountDetailsElem?.value?.parentElement?.scrollTop ?? 0;
          clientHeight.value = accountDetailsElem?.value?.clientHeight ?? 0;
        });
      }
    });

    onBeforeUnmount(() => {
      if (IS_CORDOVA) {
        window.StatusBar.backgroundColorByHexString('#141414');
      }

      resizeObserver.disconnect();
    });

    return {
      actions,
      activeIdx,
      showFilters,
      isConnected,
      accountDetailsElem,
      showNamesNavigation,
      routeName,
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

  border-radius: variables.$border-radius-app;
  min-height: 100%;
  font-weight: 500;
  color: variables.$color-white;
  box-shadow:
    0 0 0 1px variables.$color-border,
    0 0 50px rgba(variables.$color-black, 0.6);

  @include mixins.mobile {
    min-height: 100vh;
  }

  .account-info-wrapper {
    position: sticky;
    top: env(safe-area-inset-top);
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

    ::v-deep .account-info .title {
      justify-content: flex-start;
      word-break: normal;

      @extend %face-sans-16-regular;
    }
  }

  .balance-info {
    padding-top: calc(8px + env(safe-area-inset-top));
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: var(--gap);
    width: 100%;
    margin-top: 20px;
    padding: 0 var(--screen-padding-x);
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
    padding: 0 var(--screen-padding-x);
  }
}
</style>
