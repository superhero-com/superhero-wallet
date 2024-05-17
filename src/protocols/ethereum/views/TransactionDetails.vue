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
            :protocol="PROTOCOLS.ethereum"
            :hide-amount-total="!isTransactionCoin"
            :hide-fiat="!isTransactionCoin"
            show-header
          >
            <template #tokens>
              <TransactionAssetRows
                :assets="transactionAssets"
                :protocol="PROTOCOLS.ethereum"
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
                    :symbol="ETH_COIN_SYMBOL"
                    :protocol="PROTOCOLS.ethereum"
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
  ref,
  onMounted,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';

import type { AccountAddress, ICommonTransaction, ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useFungibleTokens,
  useLatestTransactionList,
  useTransactionData,
  useTransactionList,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';

import { ETH_COIN_SYMBOL } from '@/protocols/ethereum/config';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionAssetRows,
    DetailsItem,
    TokenAmount,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as AccountAddress;
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

    const { setLoaderVisible } = useUi();
    const { activeAccount } = useAccounts();
    const { getTxAmountTotal } = useFungibleTokens();
    const { accountsTransactionsPending } = useLatestTransactionList();
    const {
      direction,
      transactionAssets,
      isTransactionCoin,
      setActiveTransaction,
    } = useTransactionData({ externalAddress: transactionOwner });
    const { transactionsLoaded } = useTransactionList({
      accountAddress: transactionOwner || activeAccount.value.address,
      protocol: PROTOCOLS.ethereum,
    });

    const transaction = ref<ITransaction>();

    // TODO move these calculations to base component after unifying ITransaction AE values
    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);
    const amountTotal = computed(
      (): number => transaction.value ? getTxAmountTotal(transaction.value, direction.value) : 0,
    );

    watch(
      transaction,
      (value) => {
        setLoaderVisible(!value);
      },
      { immediate: true },
    );

    onMounted(async () => {
      const rawTransaction = await (async (): Promise<ICommonTransaction | null> => {
        // First try to pick the cached transaction.
        const loadedTransaction = transactionsLoaded.value.find((tx) => tx.hash === hash);
        if (loadedTransaction) {
          return loadedTransaction;
        }

        // If the transaction is a token transfer and it is still pending
        // use the pending transaction because API wont be synced yet.
        // pendingTransaction will have the most accurate data at this point.
        const pendingTransaction = (accountsTransactionsPending.value[transactionOwner] || [])
          .find((tx) => tx.hash === hash);
        if (pendingTransaction) {
          return pendingTransaction as ITransaction;
        }

        // Lastly try to fetch the transaction.
        try {
          return adapter.fetchTransactionByHash(hash, transactionOwner);
        } catch (e) {
          setLoaderVisible(false);
          // TODO instead moving user to different route display error message
          router.push({ name: ROUTE_NOT_FOUND });
        }

        return null;
      })() as ITransaction; // TODO establish how to pass Multisig Transaction data

      if (rawTransaction) {
        transaction.value = rawTransaction;
        setActiveTransaction(rawTransaction);
      }
    });

    return {
      ETH_COIN_SYMBOL,
      PROTOCOLS,
      amount,
      amountTotal,
      isTransactionCoin,
      direction,
      hash,
      fee,
      transaction,
      transactionAssets,
      transactionOwner,
    };
  },
});
</script>
