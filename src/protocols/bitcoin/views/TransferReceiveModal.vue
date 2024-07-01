<template>
  <ShareAddressBase
    :heading="$t('modals.receive.title', { name: protocolName })"
    :account-address="activeAccount.address"
    :protocol="PROTOCOLS.bitcoin"
    disable-asset-selection
    is-receive
    @close="resolve()"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  PROTOCOLS,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/constants';
import { useAccounts } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import ShareAddressBase, { shareAddressRequiredProps } from '@/popup/components/Modals/ShareAddressBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  components: {
    ShareAddressBase,
  },
  props: {
    ...shareAddressRequiredProps,
  },
  setup() {
    const { activeAccount } = useAccounts();

    return {
      PROTOCOLS,
      activeAccount,
      protocolName: ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin).protocolName,
    };
  },
});
</script>
