<template>
  <TransferReceiveBase
    v-bind="$attrs"
    :heading="(isMultisig)
      ? $t('modals.receiveMultisig.title')
      : $t('modals.receive.title', { name: $t('modals.receive.funds') })
    "
    :account-address="activeAccountAddress"
    :account-name="activeAccountNameComputed"
    :tokens="availableTokens"
    :disable-asset-selection="isMultisig"
    :protocol="PROTOCOL_AETERNITY"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import type { ITokenList } from '@/types';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/constants';
import { useAccounts, useMultisigAccounts } from '@/composables';

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
    const { activeAccount, activeAccountName } = useAccounts({ store });

    const availableTokens = computed<ITokenList>(
      () => store.state.fungibleTokens.availableTokens,
    );

    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccountId.value
      : activeAccount.value.address);

    const activeAccountNameComputed = computed(
      () => props.isMultisig ? undefined : activeAccountName.value,
    );

    return {
      PROTOCOL_AETERNITY,
      availableTokens,
      activeAccountAddress,
      activeAccountNameComputed,
    };
  },
});
</script>
