<template>
  <TransferReceiveBase
    v-bind="$attrs"
    :heading="isMultisig ? $t('modals.receiveMultisig.title') : $t('modals.receive.title')"
    :account-address="activeAccountAddress"
    :account-name="activeAccountName"
    :tokens="availableTokens"
    :disable-asset-selection="isMultisig"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import type { ITokenList } from '@/types';
import {
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/popup/utils';
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
    const { activeAccount } = useAccounts({ store });

    const availableTokens = computed<ITokenList>(
      () => store.state.fungibleTokens.availableTokens,
    );

    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccountId.value
      : activeAccount.value.address);

    const activeAccountName = computed(
      () => props.isMultisig ? undefined : activeAccount.value.name,
    );

    return {
      availableTokens,
      activeAccountAddress,
      activeAccountName,
    };
  },
});
</script>
