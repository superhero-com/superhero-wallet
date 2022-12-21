<template>
  <TransactionList
    :token="contractId"
    show-filters
    :scroll-top-threshold="213"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import TransactionList from '../../components/TransactionList.vue';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    TransactionList,
  },
  props: {
    contractId: { type: String, default: null },
  },
});
</script>
