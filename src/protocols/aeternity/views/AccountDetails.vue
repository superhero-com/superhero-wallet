<template>
  <AccountDetailsBase class="account-details">
    <template #account-info>
      <AccountInfo
        :address="activeAccount.address"
        :name="activeAccount.name"
        :idx="activeAccount.idx"
        can-copy-address
      />
    </template>

    <template #balance>
      <BalanceInfo
        :balance="balanceNumeric"
        horizontal-offline-message
      />
    </template>

    <template #buttons>
      <OpenTransferReceiveModalButton />
      <OpenTransferSendModalButton />
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
        :href="DEX_URL"
        :disabled="!isOnline"
      />
    </template>

    <template #navigation>
      <AccountDetailsNavigation />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { IS_IOS } from '@/lib/environment';
import { DEX_URL, PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/popup/utils';
import {
  useAccounts,
  useBalances,
  useConnection,
  useAeSdk,
} from '@/composables';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountInfo from '@/popup/components/AccountInfo.vue';
import BalanceInfo from '@/popup/components/BalanceInfo.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '@/popup/components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '@/popup/components/OpenTransferSendModalButton.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import CreditCardIcon from '@/icons/credit-card.svg?vue-component';
import SwapIcon from '@/icons/swap.svg?vue-component';
import FaucetIcon from '@/icons/faucet.svg?vue-component';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    BtnBox,
    OpenTransferSendModalButton,
    OpenTransferReceiveModalButton,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
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

    const { balance } = useBalances({ store });

    const balanceNumeric = computed(() => balance.value.toNumber());

    return {
      CreditCardIcon,
      SwapIcon,
      FaucetIcon,
      DEX_URL,
      IS_IOS,
      isOnline,
      isNodeMainnet,
      isNodeTestnet,
      balanceNumeric,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
    };
  },
});
</script>
