<template>
  <TransferReceiveBase
    :heading="$t('modals.receive.title', { name: protocolName })"
    :account-address="activeAccount.address"
    :protocol="PROTOCOL_ETHEREUM"
    disable-asset-selection
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  PROTOCOL_ETHEREUM,
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
    const { activeAccount } = useAccounts();

    return {
      PROTOCOL_ETHEREUM,
      activeAccount,
      protocolName: ProtocolAdapterFactory.getAdapter(PROTOCOL_ETHEREUM).protocolName,
    };
  },
});
</script>
