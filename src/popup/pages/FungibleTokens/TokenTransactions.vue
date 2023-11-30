<template>
  <IonPage>
    <TransactionList
      :ionic-lifecycle-status="ionicLifecycleStatus"
      :fetch-recent-transactions="fetchRecentTransactions"
      :fetch-more-transactions="fetchMoreTransactions"
      :can-load-more="canLoadMore"
      :transactions="filteredTransactions"
      :is-multisig="tokenProps?.isMultisig"
      :is-initial-loading="isInitialLoading"
    />
  </IonPage>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import type {
  ICommonTransaction,
  IonicLifecycleStatus,
  ITx,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useFungibleTokens,
  useMultisigAccounts,
  useTransactionList,
  useTokenProps,
} from '@/composables';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { getInnerTransaction } from '@/protocols/aeternity/helpers';
import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  name: 'TokenTransactions',
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const { tokenProps } = useTokenProps();

    const { activeAccount } = useAccounts();
    const { activeMultisigAccount } = useMultisigAccounts();
    const {
      fetchTransactions,
      getAccountAllTransactions,
      getAccountTransactionsState,
    } = useTransactionList();

    const { getProtocolAvailableTokens } = useFungibleTokens();

    const ionicLifecycleStatus = ref<IonicLifecycleStatus>();
    const tokensContractIds = computed(
      (): string[] => Object.keys(getProtocolAvailableTokens(PROTOCOLS.aeternity)),
    );
    const currentAddress = computed(
      () => (tokenProps.value?.isMultisig)
        ? activeMultisigAccount.value?.gaAccountId
        : activeAccount.value.address,
    );

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(currentAddress.value!).nextPageUrl
    ));

    const isInitialLoading = computed(() => (
      getAccountTransactionsState(currentAddress.value!).nextPageUrl === ''
    ));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(currentAddress.value!),
    );

    function isFungibleTokenTx(tx: ITx) {
      return tokensContractIds.value.includes(tx.contractId);
    }

    function narrowTransactionsToDefinedToken(transactionList: ICommonTransaction[]) {
      if (tokenProps.value?.contractId) {
        return transactionList.filter((transaction) => {
          const innerTx = getInnerTransaction(transaction.tx);

          if (tokenProps.value?.contractId !== AE_CONTRACT_ID) {
            return innerTx?.contractId === tokenProps.value?.contractId;
          }

          return !innerTx.contractId || !isFungibleTokenTx(innerTx);
        });
      }
      return transactionList;
    }

    const filteredTransactions = computed(
      () => narrowTransactionsToDefinedToken(loadedTransactionList.value),
    );

    async function fetchRecentTransactions() {
      await fetchTransactions(currentAddress.value!, true, tokenProps.value?.isMultisig);
    }

    async function fetchMoreTransactions() {
      await fetchTransactions(currentAddress.value!, false, tokenProps.value?.isMultisig);
    }

    onIonViewDidEnter(() => {
      ionicLifecycleStatus.value = 'didEnter';
    });

    onIonViewDidLeave(() => {
      ionicLifecycleStatus.value = 'didLeave';
    });

    return {
      canLoadMore,
      currentAddress,
      filteredTransactions,
      ionicLifecycleStatus,
      isInitialLoading,
      tokenProps,
      fetchMoreTransactions,
      fetchRecentTransactions,
    };
  },
});
</script>
