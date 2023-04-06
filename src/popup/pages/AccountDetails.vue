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
        :text="$t('pages.token-details.buy')"
        :href="activeAccountSimplexLink"
        :disabled="!isOnline"
      />
      <BtnBox
        :icon="SwapIcon"
        :text="$t('pages.token-details.swap')"
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
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { activeAccount, activeAccountSimplexLink } = useAccounts({ store: root.$store });
    const { balance } = useBalances({ store: root.$store });

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
