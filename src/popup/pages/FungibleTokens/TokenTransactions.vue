<template>
  <TransactionList
    :transactions="filteredTransactions"
    :is-multisig="isMultisig"
    :loading="loading"
    @load-more="loadMore()"
  />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import type { ICommonTransaction, ITokenList, ITx } from '@/types';
import { useAccounts, useTransactionList } from '@/composables';
import { useState } from '@/composables/vuex';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { getInnerTransaction } from '@/protocols/aeternity/helpers';

import TransactionList from '@/popup/components/TransactionList.vue';
import { TXS_PER_PAGE } from '@/constants';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    TransactionList,
  },
  props: {
    contractId: { type: String, default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();

    const { activeAccount } = useAccounts({ store });
    const {
      fetchTransactions,
      getAccountAllTransactions,
      // getAccountTransactionsState,
    } = useTransactionList({ store });

    const loading = ref(false);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const tokensContractIds = computed((): string[] => Object.keys(availableTokens.value));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(activeAccount.value.address!),
    );

    function isFungibleTokenTx(tx: ITx) {
      return tokensContractIds.value.includes(tx.contractId);
    }

    function narrowTransactionsToDefinedToken(transactionList: ICommonTransaction[]) {
      if (props.contractId) {
        return transactionList.filter((transaction) => {
          const innerTx = getInnerTransaction(transaction.tx);

          if (props.contractId !== AE_CONTRACT_ID) {
            return innerTx?.contractId === props.contractId;
          }

          return !innerTx.contractId || !isFungibleTokenTx(innerTx);
        });
      }
      return transactionList;
    }

    const filteredTransactions = computed(
      () => narrowTransactionsToDefinedToken(loadedTransactionList.value),
    );

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        await fetchTransactions(
          TXS_PER_PAGE,
          !!recent,
          activeAccount.value.address,
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value) {
        await fetchTransactionList();
      }
    }

    return {
      loading,
      filteredTransactions,
      loadMore,
    };
  },
});
</script>
