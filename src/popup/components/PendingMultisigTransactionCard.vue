<template>
  <Panel
    v-if="pendingMultisigTransaction && pendingMultisigTransaction.tx"
    class="pending-multisig-transaction-card"
    :header="$t('dashboard.pendingMultisigCard.title')"
  >
    <TransactionListItem
      :multisig-transaction="pendingMultisigTransaction"
    />
  </Panel>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePendingMultisigTransaction } from '@/composables';

import Panel from './Panel.vue';
import TransactionListItem from './TransactionListItem.vue';

export default defineComponent({
  components: {
    Panel,
    TransactionListItem,
  },
  setup() {
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();

    return {
      pendingMultisigTransaction,
    };
  },
});
</script>
