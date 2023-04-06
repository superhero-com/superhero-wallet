<template>
  <AccountDetailsBase class="account-details">
    <template #account-info>
      <AccountInfo
        :address="account.address"
        :name="account.name"
        :idx="account.idx"
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
        :href="simplexLink"
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
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useGetter } from '../../composables/vuex';
import { useBalances, useConnection } from '../../composables';
import { buildSimplexLink, DEX_URL } from '../utils';
import type { IAccount } from '../../types';

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
    console.log(props);
    const store = useStore();
    const { isOnline } = useConnection();
    const { balance } = useBalances({ store });

    const account = useGetter<IAccount>('account');

    const balanceNumeric = computed(() => balance.value.toNumber());

    const simplexLink = computed(() => buildSimplexLink(account.value.address));

    return {
      DEX_URL,
      isOnline,
      balanceNumeric,
      account,
      CreditCardIcon,
      SwapIcon,
      simplexLink,
    };
  },
});
</script>
