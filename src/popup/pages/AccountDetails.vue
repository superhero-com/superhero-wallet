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
        :icon="CreditCardIcon"
        :text="$t('common.buy')"
        :href="activeAccountSimplexLink"
        :disabled="!isOnline"
      />
      <BtnBox
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
import { useAccounts, useBalances, useConnection } from '../../composables';
import { DEX_URL } from '../utils';

import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';
import BtnBox from '../components/buttons/BtnBox.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';
import SwapIcon from '../../icons/swap.svg?vue-component';

export default defineComponent({
  components: {
    BtnBox,
    OpenTransferSendModalButton,
    OpenTransferReceiveModalButton,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
    AccountDetailsBase,
  },
  setup(props) {
    const store = useStore();
    const { isOnline } = useConnection();
    const { activeAccount, activeAccountSimplexLink } = useAccounts({ store });
    const { balance } = useBalances({ store });

    const balanceNumeric = computed(() => balance.value.toNumber());

    return {
      DEX_URL,
      isOnline,
      balanceNumeric,
      activeAccount,
      activeAccountSimplexLink,
      CreditCardIcon,
      SwapIcon,
    };
  },
});
</script>
