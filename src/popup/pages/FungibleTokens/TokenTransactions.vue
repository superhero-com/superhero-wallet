<template>
  <TransactionList
    :token-contract-id="contractId"
    :is-multisig="isMultisig"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TransactionList from '../../components/TransactionList.vue';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    TransactionList,
  },
  props: {
    contractId: { type: String, default: null },
    isMultisig: Boolean,
  },
});
</script>
