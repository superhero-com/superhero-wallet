<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="transaction-details">
        <template v-if="transaction">
          <TransactionDetailsBase
            :transaction="transaction"
            :amount="amount"
            :amount-total="amountTotal"
            :fee="fee"
            :hash="hash"
            :protocol="protocol"
            :hide-amount-total="!isTransactionCoin"
            :hide-fiat="!isTransactionCoin"
            show-header
          >
            <template #tokens>
              <TransactionAssetRows
                :assets="transactionAssets"
                :protocol="protocol"
                icon-size="rg"
                multiple-rows
              />
            </template>

            <template #gas>
              <DetailsItem
                v-if="transaction.tx.gasPrice"
                :label="$t('pages.transactionDetails.gasPrice')"
                data-cy="gas-price"
              >
                <template #value>
                  <TokenAmount
                    :amount="transaction.tx.gasPrice"
                    :symbol="coinSymbol"
                    :protocol="protocol"
                    hide-fiat
                  />
                </template>
              </DetailsItem>
              <DetailsItem
                v-if="transaction.tx.gasUsed"
                :value="transaction.tx.gasUsed"
                :label="$t('pages.transactionDetails.gasUsed')"
                data-cy="gas"
              />
              <DetailsItem
                v-if="innerTx?.callData && innerTx?.contractId"
                expandable
                class="advanced-transaction-details"
                :label="$t('transaction.advancedDetails')"
              >
                <TransactionCallDataDetails
                  :call-data="transaction.tx.callData"
                  :call-data-decoded="decodedCallData"
                  :loading="decodingCallData"
                />
              </DetailsItem>
            </template>
          </TransactionDetailsBase>
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  toRef,
  watch,
  PropType,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';

import type {
  AccountAddress,
  ICommonTransaction,
  ITransaction,
  Protocol,
} from '@/types';
import {
  useAccounts,
  useLatestTransactionList,
  useTransactionData,
  useTransactionList,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';

import { decodeTxData } from '@/protocols/ethereum/helpers';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import TransactionCallDataDetails from '@/popup/components/TransactionCallDataDetails.vue';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionAssetRows,
    DetailsItem,
    TokenAmount,
    IonContent,
    IonPage,
    TransactionCallDataDetails,
  },
  props: {
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as AccountAddress;
    const adapter = computed(() => ProtocolAdapterFactory.getAdapter(props.protocol));

    const transaction = ref<ITransaction>();
    const decodedCallData = ref();
    const decodingCallData = ref(false);

    const { setLoaderVisible } = useUi();
    const { activeAccount } = useAccounts();
    const { accountsTransactionsPending, allLatestTransactions } = useLatestTransactionList();
    const {
      amountTotal,
      transactionAssets,
      isTransactionCoin,
      innerTx,
    } = useTransactionData({
      transaction,
      transactionCustomOwner: toRef(() => transactionOwner),
    });

    const { transactionsLoaded } = useTransactionList({
      accountAddress: transactionOwner || activeAccount.value.address,
      protocol: props.protocol,
    });

    // TODO move these calculations to base component after unifying ITransaction AE values
    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);

    const coinSymbol = computed(() => adapter.value.coinSymbol);
    const coinContractId = computed(() => adapter.value.coinContractId);

    async function getDecodedCallData() {
      if (innerTx.value?.callData && innerTx.value?.contractId) {
        return decodeTxData(
          innerTx.value.callData,
          (innerTx.value.contractId !== coinContractId.value)
            ? innerTx.value.contractId
            : innerTx.value.recipientId,
          activeAccount.value.address,
        );
      }
      return null;
    }

    watch(
      transaction,
      async (value) => {
        setLoaderVisible(!value);
        decodingCallData.value = true;
        decodedCallData.value = await getDecodedCallData();
        decodingCallData.value = false;
      },
      { immediate: true },
    );

    onMounted(async () => {
      const rawTransaction = await (async (): Promise<ICommonTransaction | null> => {
        // First try to pick the transaction from global cache (most reliable)
        const globalTransaction = allLatestTransactions.value.find((tx) => tx.hash === hash);

        if (globalTransaction && globalTransaction.protocol === props.protocol) {
          return globalTransaction;
        }

        // Then try the protocol-specific cache
        const loadedTransaction = transactionsLoaded.value.find((tx) => tx.hash === hash);

        const isCallDataDeprecated = (
          loadedTransaction?.tx?.type === 'ContractCallTx'
          && (loadedTransaction?.tx?.callData as string) === 'deprecated'
        );

        if (loadedTransaction && !isCallDataDeprecated) {
          return loadedTransaction;
        }

        // If the transaction is a token transfer and it is still pending
        // use the pending transaction because API wont be synced yet.
        // pendingTransaction will have the most accurate data at this point.
        const pendingTransaction = (
          accountsTransactionsPending.value[transactionOwner]
          || []
        )
          .find((tx) => tx.hash === hash && tx.protocol === props.protocol);
        if (pendingTransaction) {
          return pendingTransaction as ITransaction;
        }

        // Lastly try to fetch the transaction.
        try {
          return adapter.value.fetchTransactionByHash(hash, transactionOwner);
        } catch (e) {
          setLoaderVisible(false);
          // TODO instead moving user to different route display error message
          router.push({ name: ROUTE_NOT_FOUND });
        }

        return null;
      })() as ITransaction; // TODO establish how to pass Multisig Transaction data

      if (rawTransaction) {
        transaction.value = rawTransaction;
      }
    });

    return {
      amount,
      amountTotal,
      decodedCallData,
      decodingCallData,
      innerTx,
      isTransactionCoin,
      hash,
      fee,
      transaction,
      transactionAssets,
      coinSymbol,
    };
  },
});
</script>

<style lang="scss" scoped>
.transaction-details {
  .advanced-transaction-details {
    width:100%;
  }
}
</style>
