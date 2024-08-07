<template>
  <ShareAddressBase
    :heading="(isMultisig)
      ? $t('modals.receiveMultisig.title')
      : $t('modals.receive.title', { name: $t('modals.receive.funds') })
    "
    :account-address="activeAccountAddress"
    :account-name="activeAccountName"
    :tokens="tokens"
    :disable-asset-selection="isMultisig"
    :protocol="PROTOCOLS.aeternity"
    :token-contract-id="tokenContractId"
    is-receive
    @close="resolve()"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import {
  PROTOCOLS,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/constants';
import { useAccounts, useFungibleTokens, useMultisigAccounts } from '@/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import ShareAddressBase, { shareAddressRequiredProps } from '@/popup/components/Modals/ShareAddressBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  components: {
    ShareAddressBase,
  },
  props: {
    ...shareAddressRequiredProps,
    isMultisig: Boolean,
  },
  setup(props) {
    const { activeMultisigAccountId } = useMultisigAccounts({ pollOnce: true });
    const { activeAccount } = useAccounts();
    const { getName } = useAeNames();
    const { getProtocolAvailableTokens } = useFungibleTokens();

    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccountId.value
      : activeAccount.value.address);

    const activeAccountName = props.isMultisig ? undefined : getName(activeAccount.value.address);

    const tokens = computed(() => getProtocolAvailableTokens(PROTOCOLS.aeternity));

    return {
      PROTOCOLS,
      tokens,
      activeAccountAddress,
      activeAccountName,
    };
  },
});
</script>
