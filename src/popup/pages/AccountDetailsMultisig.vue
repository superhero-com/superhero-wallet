<template>
  <AccountDetailsBase v-if="activeMultisigAccount">
    <template #account-info>
      <AccountInfo
        :address="activeMultisigAccount.gaAccountId"
        is-multisig
        can-copy-address
      />
    </template>

    <template #balance>
      <BalanceInfo :balance="+(activeMultisigAccount.balance || 0)" />
    </template>

    <template #buttons>
      <OpenTransferReceiveModalButton is-multisig />
      <OpenTransferProposeModalButton />
      <BtnBox
        :icon="CreditCardIcon"
        :text="$t('pages.token-details.buy')"
        @click="window.open(simplexLink, '_blank')"
      />
    </template>

    <template #navigation>
      <AccountDetailsNavigation is-multisig />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useMultisigAccounts } from '../../composables';

import BtnBox from '../components/buttons/BtnBox.vue';
import AccountDetailsBase from '../components/AccountDetailsBase.vue';
import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import AccountDetailsNavigation from '../components/AccountDetailsNavigation.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferProposeModalButton from '../components/OpenTransferProposeModalButton.vue';

import CreditCardIcon from '../../icons/credit-card.svg?vue-component';
import { buildSimplexLink } from '../utils';

export default defineComponent({
  components: {
    OpenTransferProposeModalButton,
    BtnBox,
    OpenTransferReceiveModalButton,
    AccountDetailsNavigation,
    BalanceInfo,
    AccountInfo,
    AccountDetailsBase,
  },
  setup(props, { root }) {
    const { activeMultisigAccount } = useMultisigAccounts({ store: root.$store });

    const simplexLink = computed(
      () => activeMultisigAccount.value
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    return {
      activeMultisigAccount,
      simplexLink,
      CreditCardIcon,
    };
  },
});
</script>
