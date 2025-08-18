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
            :protocol="PROTOCOLS.solana"
            :hide-amount-total="!isTransactionCoin"
            :hide-fiat="!isTransactionCoin"
            show-header
          >
            <template #tokens>
              <TransactionAssetRows
                :assets="transactionAssets"
                :protocol="PROTOCOLS.solana"
                icon-size="rg"
                multiple-rows
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
  onMounted,
  ref,
  toRef,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';

import type { AccountAddress, ICommonTransaction, ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useLatestTransactionList,
  useTransactionData,
  useTransactionList,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';

import { SOL_COIN_SYMBOL } from '@/protocols/solana/config';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionAssetRows,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as AccountAddress;
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);

    const transaction = ref<ITransaction>();

    const { setLoaderVisible } = useUi();
    const { activeAccount } = useAccounts();
    const { accountsTransactionsPending } = useLatestTransactionList();
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
      protocol: PROTOCOLS.solana,
    });

    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);

    watch(
      transaction,
      (value) => {
        setLoaderVisible(!value);
      },
      { immediate: true },
    );

    onMounted(async () => {
      const rawTransaction = await (async (): Promise<ICommonTransaction | null> => {
        const loadedTransaction = transactionsLoaded.value.find((tx) => tx.hash === hash);
        if (loadedTransaction) {
          return loadedTransaction;
        }

        const pendingTransaction = (accountsTransactionsPending.value[transactionOwner] || [])
          .find((tx) => tx.hash === hash);
        if (pendingTransaction) {
          return pendingTransaction as ITransaction;
        }

        try {
          return adapter.fetchTransactionByHash(hash, transactionOwner);
        } catch (e) {
          setLoaderVisible(false);
          router.push({ name: ROUTE_NOT_FOUND });
        }

        return null;
      })() as ITransaction;

      if (rawTransaction) {
        transaction.value = rawTransaction;
      }
    });

    return {
      SOL_COIN_SYMBOL,
      PROTOCOLS,
      amount,
      amountTotal,
      innerTx,
      isTransactionCoin,
      hash,
      fee,
      transaction,
      transactionAssets,
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
