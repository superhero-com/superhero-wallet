<template>
  <IonPage>
    <TransactionList
      :ionic-lifecycle-status="ionicLifecycleStatus"
      :fetch-recent-transactions="fetchRecentTransactions"
      :fetch-more-transactions="fetchMoreTransactions"
      :can-load-more="canLoadMore"
      :transactions="filteredTransactions"
      :is-multisig="isMultisig"
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
  useAssetDetails,
  useFungibleTokens,
  useMultisigAccounts,
  useTransactionList,
} from '@/composables';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { getInnerTransaction } from '@/protocols/aeternity/helpers';
import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  name: 'AssetDetailsTransactions',
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const { sharedAssetDetails } = useAssetDetails();
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

    const isMultisig = computed((): boolean => !!sharedAssetDetails.value.isMultisig);
    const assetContractId = computed(() => sharedAssetDetails.value.contractId);

    const currentAddress = computed(
      () => (isMultisig.value)
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
      if (assetContractId.value) {
        return transactionList.filter((transaction) => {
          const innerTx = getInnerTransaction(transaction.tx);

          if (assetContractId.value !== AE_CONTRACT_ID) {
            return innerTx?.contractId === assetContractId.value;
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
      await fetchTransactions(currentAddress.value!, true, isMultisig.value);
    }

    async function fetchMoreTransactions() {
      await fetchTransactions(currentAddress.value!, false, isMultisig.value);
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
      isMultisig,
      fetchMoreTransactions,
      fetchRecentTransactions,
    };
  },
});
</script>
