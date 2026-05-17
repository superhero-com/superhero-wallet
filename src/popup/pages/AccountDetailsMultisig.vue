<template>
  <AccountDetailsBase
    v-if="activeMultisigAccount"
    without-default-buttons
  >
    <template #account-info>
      <AccountInfo
        :account="convertMultisigAccountToAccount(activeMultisigAccount)"
        is-multisig
        show-protocol-icon
        can-copy-address
      />
    </template>

    <template #balance>
      <BalanceInfo
        :balance="+(activeMultisigAccount.balance || 0)"
        :protocol="PROTOCOLS.aeternity"
      />
    </template>

    <template #buttons>
      <OpenTransferReceiveModalBtn is-multisig />
      <OpenTransferSendModalBtn
        :disabled="!!pendingMultisigTransaction"
        is-multisig
      />
      <OpenShareAddressModalBtn
        :address="convertMultisigAccountToAccount(activeMultisigAccount).address!"
        :protocol="PROTOCOLS.aeternity"
      />
      <BtnBox
        v-if="UNFINISHED_FEATURES"
        :icon="CreditCardIcon"
        :text="$t('common.buy')"
        :href="simplexLink"
      />
    </template>

    <template #navigation>
      <AccountDetailsNavigation
        :route-names="[
          ROUTE_MULTISIG_DETAILS,
          ROUTE_MULTISIG_DETAILS_INFO,
          ROUTE_MULTISIG_DETAILS_ASSETS,
        ]"
      />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { PROTOCOLS, UNFINISHED_FEATURES } from '@/constants';
import { useMultisigAccounts, usePendingMultisigTransaction } from '@/composables';
import {
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_ASSETS,
  ROUTE_MULTISIG_DETAILS_INFO,
} from '@/popup/router/routeNames';
import { buildSimplexLink, convertMultisigAccountToAccount } from '@/protocols/aeternity/helpers';

import BtnBox from '../components/buttons/BtnBox.vue';
import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalBtn from '../components/OpenTransferReceiveModalBtn.vue';
import OpenTransferSendModalBtn from '../components/OpenTransferSendModalBtn.vue';
import OpenShareAddressModalBtn from '../components/OpenShareAddressModalBtn.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';

export default defineComponent({
  components: {
    OpenTransferSendModalBtn,
    OpenTransferReceiveModalBtn,
    OpenShareAddressModalBtn,
    BtnBox,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
    AccountDetailsBase,
  },
  setup() {
    const { activeMultisigAccount } = useMultisigAccounts();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();

    const simplexLink = computed(
      () => (activeMultisigAccount.value)
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    return {
      UNFINISHED_FEATURES,
      PROTOCOLS,
      ROUTE_MULTISIG_DETAILS,
      ROUTE_MULTISIG_DETAILS_INFO,
      ROUTE_MULTISIG_DETAILS_ASSETS,
      activeMultisigAccount,
      simplexLink,
      pendingMultisigTransaction,
      CreditCardIcon,
      convertMultisigAccountToAccount,
    };
  },
});
</script>
