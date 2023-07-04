<template>
  <div
    ref="accountDetailsElem"
    class="account-details"
  >
    <div class="account-info-wrapper">
      <slot name="account-info" />

      <BtnClose
        class="close-button"
        :to="{ name: homeRouteName }"
      />
    </div>
    <div>
      <slot name="balance" />

      <div class="buttons">
        <slot name="buttons" />
      </div>

      <div class="header">
        <slot name="navigation" />

        <TransactionAndTokenFilter
          :key="routeName!"
          :show-filters="showFilters"
        />
      </div>

      <div class="tabs-content">
        <RouterView v-slot="{ Component }">
          <transition
            name="fade-transition"
            mode="out-in"
          >
            <Component :is="Component" />
          </transition>
        </RouterView>
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
} from 'vue';
import { debounce } from 'lodash-es';
import { useRoute } from 'vue-router';
import {
  EXTENSION_HEIGHT,
} from '../utils';
import {
  useTransactionAndTokenFilter,
  useUi,
} from '../../composables';
import { IS_MOBILE } from '../../lib/environment';

import BtnClose from './buttons/BtnClose.vue';
import TransactionAndTokenFilter from './TransactionAndTokenFilter.vue';

export default defineComponent({
  name: 'AccountDetailsBase',
  components: {
    TransactionAndTokenFilter,
    BtnClose,
  },
  setup() {
    const route = useRoute();

    const ACCOUNT_INFO_HEIGHT = 120;
    const BALANCE_AND_ACTIONS_HEIGHT = 280;
    const accountDetailsElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const clientHeight = ref<number>(0);
    const initialClientHeight = ref<number>(EXTENSION_HEIGHT);

    const { resetFilter } = useTransactionAndTokenFilter();

    const { homeRouteName } = useUi();

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => accountDetailsElem.value?.parentElement,
    );

    const routeName = computed(() => route.name);

    const showFilters = computed<boolean>(() => (
      clientHeight.value > initialClientHeight.value
        && appInnerScrollTop.value >= ACCOUNT_INFO_HEIGHT
    ));

    const resizeObserver = new ResizeObserver(debounce((entries) => {
      if (!(Array.isArray(entries) && entries.length)) {
        return;
      }

      const newClientHeight = entries[0].target.clientHeight;

      const totalHeight = clientHeight.value + BALANCE_AND_ACTIONS_HEIGHT + ACCOUNT_INFO_HEIGHT;

      if (
        newClientHeight
          && (
            totalHeight < newClientHeight
            || newClientHeight <= initialClientHeight.value
          )
      ) {
        clientHeight.value = newClientHeight;
      }
    }, 100));

    watch(
      () => route,
      () => {
        clientHeight.value = 0;
        resetFilter();
      },
    );

    onMounted(() => {
      if (IS_MOBILE) {
        window.StatusBar.setBackgroundColor('#191919');
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
      if (IS_MOBILE) {
        window.StatusBar.setBackgroundColor('#141414');
      }

      resizeObserver.disconnect();
    });

    return {
      homeRouteName,
      showFilters,
      accountDetailsElem,
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
  box-shadow: 0 0 0 1px variables.$color-border, 0 0 50px rgba(variables.$color-black, 0.6);

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

    :deep(.account-info .title) {
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

  .close-button {
    position: absolute;
    top: 4px;
    right: 8px;
  }
}
</style>
