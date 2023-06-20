<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <TransactionList
        :transactions="filteredTransactions"
        :is-multisig="isMultisig"
        :loading="loading"
        @load-more="loadMore()"
      />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
} from 'vue';
import {
  IonContent,
  IonPage,
} from '@ionic/vue';
import { useStore } from 'vuex';
import TransactionList from '@/popup/components/TransactionList.vue';
import type { ICommonTransaction, ITokenList, ITx } from '@/types';
import { TXS_PER_PAGE } from '@/constants';
import { useAccounts, useMultisigAccounts, useTransactionList } from '@/composables';
import { useState } from '@/composables/vuex';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { getInnerTransaction } from '@/protocols/aeternity/helpers';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    TransactionList,
    IonPage,
    IonContent,
  },
  props: {
    contractId: { type: String, default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();

    const { activeAccount } = useAccounts({ store });
    const { activeMultisigAccount } = useMultisigAccounts({ store });
    const {
      fetchTransactions,
      getAccountAllTransactions,
      getAccountTransactionsState,
    } = useTransactionList({ store });

    const loading = ref(false);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const tokensContractIds = computed((): string[] => Object.keys(availableTokens.value));
    const currentAddress = computed(
      () => (props.isMultisig)
        ? activeMultisigAccount.value?.gaAccountId
        : activeAccount.value.address,
    );

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(currentAddress.value!).nextPageUrl
    ));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(currentAddress.value!),
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
          currentAddress.value!,
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value && canLoadMore.value) {
        await fetchTransactionList();
      }
    }

    onMounted(() => {
      fetchTransactionList();
    });

    return {
      loading,
      filteredTransactions,
      loadMore,
    };
  },
});
</script>
