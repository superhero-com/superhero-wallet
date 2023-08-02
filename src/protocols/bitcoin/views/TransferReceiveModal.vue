<template>
  <TransferReceiveBase
    v-bind="$attrs"
    heading="BTC receive modal temporary heading"
    :account-address="activeAccount.address"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import {
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
} from '@/config';
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
      activeAccount,
    };
  },
});
</script>
