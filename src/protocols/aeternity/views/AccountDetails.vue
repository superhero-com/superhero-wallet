<template>
  <AccountDetailsBase class="account-details">
    <template #buttons>
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
      <BtnBox
        v-if="!IS_IOS && (isNodeMainnet || isNodeTestnet)"
        :icon="SwapIcon"
        :text="$t('common.swap')"
        :href="AE_DEX_URL"
        :disabled="!isOnline"
      />
    </template>

    <template #navigation>
      <AccountDetailsNavigation />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { IS_IOS, PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import {
  useAccounts,
  useConnection,
  useAeSdk,
} from '@/composables';
import { AE_DEX_URL } from '@/protocols/aeternity/config';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import CreditCardIcon from '@/icons/credit-card.svg?vue-component';
import SwapIcon from '@/icons/swap.svg?vue-component';
import FaucetIcon from '@/icons/faucet.svg?vue-component';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    BtnBox,
    AccountDetailsNavigation,
    AccountDetailsBase,
  },
  setup() {
    const store = useStore();
    const { isOnline } = useConnection();

    const { isNodeMainnet, isNodeTestnet } = useAeSdk({ store });

    const {
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
    } = useAccounts({ store });

    return {
      CreditCardIcon,
      SwapIcon,
      FaucetIcon,
      AE_DEX_URL,
      IS_IOS,
      isOnline,
      isNodeMainnet,
      isNodeTestnet,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
    };
  },
});
</script>
