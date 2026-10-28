<template>
  <div class="apps-browser-header">
    <AccountSelector
      :model-value="activeAccount.address"
      avatar-only
      @select-account="selectAccount"
    />

    <div class="title">
      <Truncate
        :str="$t('pages.titles.appsBrowser')"
        class="text"
      />
    </div>

    <BtnClose
      data-cy="btn-close"
      class="btn-close"
      @click="close"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useIonRouter } from '@ionic/vue';
import type { IAccount } from '@/types';
import { useAccounts, useUi } from '@/composables';
import { ROUTE_INDEX } from '@/popup/router/routeNames';

import AccountSelector from '@/popup/components/AccountSelector.vue';
import Truncate from '@/popup/components/Truncate.vue';
import BtnClose from '@/popup/components/buttons/BtnClose.vue';

export default defineComponent({
  components: {
    BtnClose,
    Truncate,
    AccountSelector,
  },
  setup() {
    const ionRouter = useIonRouter();
    const { homeRouteName } = useUi();
    const { isLoggedIn, activeAccount, setActiveAccountByGlobalIdx } = useAccounts();

    const currentHomeRouteName = computed(
      () => isLoggedIn.value
        ? homeRouteName.value
        : ROUTE_INDEX,
    );

    function selectAccount(account?: IAccount) {
      if (account) {
        setActiveAccountByGlobalIdx(account.globalIdx);
      }
    }

    function close() {
      ionRouter.navigate(`/${currentHomeRouteName.value}`, 'back', 'push');
    }

    return {
      activeAccount,
      selectAccount,
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
