<template>
  <AccountDetailsBase
    v-if="activeMultisigAccount"
    without-default-buttons
  >
    <template #account-info>
      <AccountInfo
        :account="convertMultisigAccountToAccount(activeMultisigAccount)"
        is-multisig
        with-protocol-icon
        can-copy-address
      />
    </template>

    <template #balance>
      <BalanceInfo
        :balance="+(activeMultisigAccount.balance || 0)"
        :protocol="PROTOCOL_AETERNITY"
      />
    </template>

    <template #buttons>
      <OpenTransferReceiveModalButton is-multisig />
      <OpenTransferSendModalButton is-multisig />
      <BtnBox
        v-if="UNFINISHED_FEATURES"
        :icon="CreditCardIcon"
        :text="$t('common.buy')"
        :href="simplexLink"
      />
    </template>

    <template #navigation>
      <AccountDetailsNavigation is-multisig />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { PROTOCOL_AETERNITY, UNFINISHED_FEATURES } from '@/constants';
import { useMultisigAccounts } from '@/composables';
import { buildSimplexLink, convertMultisigAccountToAccount } from '@/protocols/aeternity/helpers';

import BtnBox from '../components/buttons/BtnBox.vue';
import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';

export default defineComponent({
  components: {
    OpenTransferSendModalButton,
    BtnBox,
    OpenTransferReceiveModalButton,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
    AccountDetailsBase,
  },
  setup() {
    const store = useStore();
    const { activeMultisigAccount } = useMultisigAccounts({ store });

    const simplexLink = computed(
      () => (activeMultisigAccount.value)
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    return {
      UNFINISHED_FEATURES,
      PROTOCOL_AETERNITY,
      activeMultisigAccount,
      simplexLink,
      CreditCardIcon,
      convertMultisigAccountToAccount,
    };
  },
});
</script>
