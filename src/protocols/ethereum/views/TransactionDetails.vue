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
            :coin-symbol="ETH_SYMBOL"
            :token-symbol="getTxAssetSymbol(transaction)"
            :hash="hash"
            :none-ae-coin="tokens"
            :protocol="PROTOCOLS.ethereum"
            :hide-amount-total="!isTransactionCoin"
            :hide-fiat="!isTransactionCoin"
            show-header
          >
            <template #tokens>
              <TransactionTokenRows
                :ext-tokens="tokens"
                :direction="direction"
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
                    :symbol="ETH_SYMBOL"
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

import type { ITokenResolved, ITransaction } from '@/types';
import { TX_DIRECTION, PROTOCOLS } from '@/constants';
import { useFungibleTokens, useLatestTransactionList, useUi } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { ETH_SYMBOL } from '@/protocols/ethereum/config';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionTokenRows from '@/popup/components/TransactionTokenRows.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import { isCoin } from '@/utils';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionTokenRows,
    DetailsItem,
    TokenAmount,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { setLoaderVisible } = useUi();
    const { getTxAmountTotal, getTxAssetSymbol } = useFungibleTokens();
    const { accountsTransactionsPending } = useLatestTransactionList();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as string;
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

    const transaction = ref<ITransaction>();

    const direction = computed(
      () => (transactionOwner === transaction.value?.tx?.senderId)
        ? TX_DIRECTION.sent
        : TX_DIRECTION.received,
    );

    const isTransactionCoin = computed(
      () => isCoin(transaction.value?.tx?.contractId!),
    );

    // TODO move these calculations to base component after unifying ITransaction AE values
    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);
    const amountTotal = computed(
      (): number => getTxAmountTotal(transaction.value!, direction.value),
    );

    const tokens = computed((): ITokenResolved[] => [{
      amount: isTransactionCoin.value ? amountTotal.value : amount.value,
      symbol: getTxAssetSymbol(transaction.value!),
      isReceived: direction.value === TX_DIRECTION.received,
      contractId: transaction.value?.tx?.contractId,
      isAe: false,
    }]);

    watch(
      transaction,
      (value) => {
        setLoaderVisible(!value);
      },
      { immediate: true },
    );

    onMounted(async () => {
      // If the transaction is a token transfer and it is still pending use the pending transaction
      // because API wont be synced yet
      // pendingTransaction will have the most accurate data at this point
      const pendingTokenTransaction = (accountsTransactionsPending.value[transactionOwner] || [])
        .find((tx) => tx.hash === hash && tx.tx?.contractId !== adapter.coinContractId);

      if (pendingTokenTransaction) {
        transaction.value = pendingTokenTransaction as ITransaction;
      } else {
        try {
          transaction.value = await adapter.fetchTransactionByHash(hash, transactionOwner);
        } catch (e) {
          setLoaderVisible(false);
          router.push({ name: ROUTE_NOT_FOUND });
        }
      }
    });

    return {
      ETH_SYMBOL,
      PROTOCOLS,
      amount,
      amountTotal,
      transactionOwner,
      isTransactionCoin,
      direction,
      hash,
      transaction,
      fee,
      tokens,
      getTxAssetSymbol,
    };
  },
});
</script>
