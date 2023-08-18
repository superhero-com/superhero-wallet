<template>
  <TransferReceiveBase
    v-bind="$attrs"
    heading="BTC receive modal temporary heading"
    :account-address="activeAccount.address"
    :protocol="PROTOCOL_BITCOIN"
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
    };
  },
});
</script>
