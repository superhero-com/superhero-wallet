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
            :coin-symbol="BTC_SYMBOL"
            :token-symbol="BTC_SYMBOL"
            :hash="hash"
            :none-ae-coin="tokens"
            :protocol="PROTOCOLS.bitcoin"
            show-header
          >
            <template #tokens>
              <TransactionTokenRows
                :ext-tokens="tokens"
                :is-rounded="!!tokens"
                :transaction="transaction"
                :direction="direction"
                :protocol="PROTOCOLS.bitcoin"
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
  ref,
  onMounted,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';

import type { ITokenResolved, ITransaction } from '@/types';
import { TX_DIRECTION, PROTOCOLS } from '@/constants';
import { useUi } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { getTxAmountTotal } from '@/protocols/bitcoin/helpers';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionTokenRows from '@/popup/components/TransactionTokenRows.vue';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionTokenRows,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { setLoaderVisible } = useUi();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as string;
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);

    const transaction = ref<ITransaction>();

    const isReceived = computed(() => transaction.value?.tx?.senderId !== transactionOwner);
    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);
    const amountTotal = computed((): number => transaction.value?.tx
      ? getTxAmountTotal(transaction.value, isReceived.value)
      : 0);

    const direction = computed(() => isReceived.value ? TX_DIRECTION.received : TX_DIRECTION.sent);

    const tokens = computed((): ITokenResolved[] => [{
      amount: amount.value,
      symbol: BTC_SYMBOL,
      isReceived: direction.value === TX_DIRECTION.received,
      contractId: adapter.coinContractId,
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
      try {
        transaction.value = {
          ...await adapter.fetchTransactionByHash(hash),
          transactionOwner,
        };
      } catch (e) {
        router.push({ name: ROUTE_NOT_FOUND });
      }
    });

    return {
      BTC_SYMBOL,
      PROTOCOLS,
      amount,
      amountTotal,
      direction,
      fee,
      hash,
      tokens,
      transaction,
    };
  },
});
</script>
