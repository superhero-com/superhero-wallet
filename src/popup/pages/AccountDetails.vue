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
        v-if="isNodeMainnet && !IS_IOS"
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
import { IS_IOS } from '../../lib/environment';
import { DEX_URL } from '../utils';
import {
  useAccounts,
  useBalances,
  useConnection,
  useAeSdk,
} from '../../composables';

import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';
import BtnBox from '../components/buttons/BtnBox.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';
import SwapIcon from '../../icons/swap.svg?vue-component';
import FaucetIcon from '../../icons/faucet.svg?vue-component';

export default defineComponent({
  name: 'AccountDetails',
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
    };
  },
});
</script>
