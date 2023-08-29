<template>
  <TransferReceiveBase
    v-bind="$attrs"
    :heading="$t('modals.receive.title', { name: protocolName })"
    :account-address="activeAccount.address"
    :protocol="PROTOCOL_BITCOIN"
    disable-asset-selection
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import {
  PROTOCOL_BITCOIN,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/constants';
import { useAccounts } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransferReceiveBase from '@/popup/components/Modals/TransferReceiveBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  components: {
    TransferReceiveBase,
  },
  setup() {
    const store = useStore();
    const { activeAccount } = useAccounts({ store });

    return {
      PROTOCOL_BITCOIN,
      activeAccount,
      protocolName: ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN).protocolName,
    };
  },
});
</script>
