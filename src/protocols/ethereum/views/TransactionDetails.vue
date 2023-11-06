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
            :token-symbol="ETH_SYMBOL"
            :hash="hash"
            :none-ae-coin="tokens"
            :protocol="PROTOCOLS.ethereum"
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

import { ETH_SYMBOL } from '@/protocols/ethereum/config';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';

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
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

    const transaction = ref<ITransaction>();

    const direction = computed(
      () => (transactionOwner === transaction.value?.tx?.senderId)
        ? TX_DIRECTION.sent
        : TX_DIRECTION.received,
    );

    // TODO move these calculations to base component after unifying ITransaction AE values
    const fee = computed((): number => transaction.value?.tx?.fee || 0);
    const amount = computed((): number => transaction.value?.tx?.amount || 0);
    const amountTotal = computed((): number => amount.value + fee.value);

    const tokens = computed((): ITokenResolved[] => [{
      amount: amountTotal.value,
      symbol: ETH_SYMBOL,
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
      ETH_SYMBOL,
      PROTOCOLS,
      amount,
      amountTotal,
      transactionOwner,
      direction,
      hash,
      transaction,
      fee,
      tokens,
    };
  },
});
</script>
