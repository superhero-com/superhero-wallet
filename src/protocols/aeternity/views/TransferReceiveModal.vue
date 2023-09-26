<template>
  <TransferReceiveBase
    v-bind="$attrs"
    :heading="(isMultisig)
      ? $t('modals.receiveMultisig.title')
      : $t('modals.receive.title', { name: $t('modals.receive.funds') })
    "
    :account-address="activeAccountAddress"
    :account-name="activeAccountName"
    :tokens="availableTokens"
    :disable-asset-selection="isMultisig"
    :protocol="PROTOCOL_AETERNITY"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/constants';
import { useAccounts, useFungibleTokens, useMultisigAccounts } from '@/composables';

import TransferReceiveBase from '@/popup/components/Modals/TransferReceiveBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  components: {
    TransferReceiveBase,
  },
  props: {
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { activeMultisigAccountId } = useMultisigAccounts({ store, pollOnce: true });
    const { activeAccount } = useAccounts({ store });
    const { availableTokens } = useFungibleTokens();

    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccountId.value
      : activeAccount.value.address);

    const activeAccountName = computed(
      () => props.isMultisig ? undefined : activeAccount.value.name,
    );

    return {
      PROTOCOL_AETERNITY,
      availableTokens,
      activeAccountAddress,
      activeAccountName,
    };
  },
});
</script>
