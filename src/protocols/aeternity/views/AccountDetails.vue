<template>
  <PageWrapper hide-header>
    <AccountDetailsBase
      class="account-details"
    >
      <template #buttons>
        <BtnBox
          v-if="IS_MOBILE_APP && (isNodeMainnet || isNodeTestnet) || UNFINISHED_FEATURES"
          :icon="GlobeSmallIcon"
          :text="$t('common.browser')"
          :to="{ name: ROUTE_APPS_BROWSER }"
        />
        <BtnBox
          v-if="isNodeMainnet && UNFINISHED_FEATURES"
          :icon="CreditCardIcon"
          :text="$t('common.buy')"
          :href="activeAccountSimplexLink"
          :disabled="!isOnline"
        />
        <BtnBox
          v-if="isNodeTestnet"
          :icon="FaucetIcon"
          :text="$t('common.faucet')"
          :href="activeAccountFaucetUrl"
        />
      </template>

      <template #navigation>
        <AccountDetailsNavigation
          :route-names="[
            ROUTE_ACCOUNT_DETAILS,
            ROUTE_ACCOUNT_DETAILS_ASSETS,
            ROUTE_ACCOUNT_DETAILS_NAMES,
          ]"
        />
      </template>
    </AccountDetailsBase>
  </PageWrapper>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from 'vue';
import {
  IS_MOBILE_APP,
  IS_IOS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  UNFINISHED_FEATURES,
} from '@/constants';
import {
  useAccounts,
  useConnection,
  useAeSdk,
} from '@/composables';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_ASSETS,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_APPS_BROWSER,
} from '@/popup/router/routeNames';
import { AE_DEX_URL } from '@/protocols/aeternity/config';
import { buildAeFaucetUrl, buildSimplexLink } from '@/protocols/aeternity/helpers';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import CreditCardIcon from '@/icons/credit-card.svg?vue-component';
import SwapIcon from '@/icons/swap.svg?vue-component';
import FaucetIcon from '@/icons/faucet.svg?vue-component';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    PageWrapper,
    BtnBox,
    AccountDetailsNavigation,
    AccountDetailsBase,
  },
  setup() {
    const { isOnline } = useConnection();
    const { isNodeMainnet, isNodeTestnet } = useAeSdk();
    const { activeAccount } = useAccounts();

    const activeAccountFaucetUrl = computed(() => buildAeFaucetUrl(activeAccount.value.address));
    const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

    return {
      UNFINISHED_FEATURES,
      ROUTE_APPS_BROWSER,
      ROUTE_ACCOUNT_DETAILS,
      ROUTE_ACCOUNT_DETAILS_ASSETS,
      ROUTE_ACCOUNT_DETAILS_NAMES,
      AE_DEX_URL,
      IS_MOBILE_APP,
      IS_IOS,
      CreditCardIcon,
      SwapIcon,
      FaucetIcon,
      GlobeSmallIcon,
      isOnline,
      isNodeMainnet,
      isNodeTestnet,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
    };
  },
});
</script>
