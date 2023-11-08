<template>
  <TransactionList
    :fetch-recent-transactions="() => fetchTransactions(address, true, isMultisig)"
    :fetch-more-transactions="() => fetchTransactions(address, false, isMultisig)"
    :can-load-more="canLoadMore"
    :is-initial-loading="isInitialLoading"
    :transactions="loadedTransactionList"
    :is-multisig="isMultisig"
    :ionic-lifecycle-status="ionicLifecycleStatus"
  />
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';

import type {
  ICommonTransaction,
  IonicLifecycleStatus,
  ITransaction,
} from '@/types';
import { useTransactionList } from '@/composables';

import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
  },
  props: {
    address: { type: String, required: true },
    additionalTransactions: { type: Array as PropType<ITransaction[]>, default: null },
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
    isMultisig: { type: Boolean },
  },
  setup(props) {
    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList();

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(props.address as any).nextPageUrl
    ));

    const isInitialLoading = computed(() => (
      getAccountTransactionsState(props.address as any).nextPageUrl === ''
    ));

    const loadedTransactionList = computed((): ICommonTransaction[] => [
      ...getAccountAllTransactions(props.address as any),
      ...(props.additionalTransactions || []),
    ]);

    return {
      canLoadMore,
      fetchTransactions,
      isInitialLoading,
      loadedTransactionList,
    };
  },
});
</script>
