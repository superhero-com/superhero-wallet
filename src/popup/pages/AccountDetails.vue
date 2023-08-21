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
        :subtitle="'Testnet coin'"
        :href="activeAccountFaucetUrl"
      />
      <BtnBox
        v-else-if="!IS_IOS && (isNodeMainnet || isNodeTestnet)"
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
import { computed, defineComponent } from '@vue/composition-api';
import { IS_IOS } from '../../lib/environment';
import { DEX_URL } from '../utils';
import {
  useAccounts,
  useBalances,
  useConnection,
  useSdk,
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
  setup(props, { root }) {
    const { isOnline } = useConnection();

    const { isNodeMainnet, isNodeTestnet } = useSdk({ store: root.$store });

    const {
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
    } = useAccounts({ store: root.$store });

    const { balance } = useBalances({ store: root.$store });

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
