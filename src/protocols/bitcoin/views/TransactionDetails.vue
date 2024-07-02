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
            :protocol="PROTOCOLS.bitcoin"
            show-header
          >
            <template #tokens>
              <TransactionAssetRows
                :assets="assets"
                :is-rounded="!!assets"
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
import { useTransactionData, useUi } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { BTC_PROTOCOL_NAME, BTC_SYMBOL } from '@/protocols/bitcoin/config';

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
    const { setLoaderVisible } = useUi();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as string;
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);

    const transaction = ref<ITransaction>();

    const {
      amount,
      amountTotal,
      fee,
    } = useTransactionData({ transaction });

    const isReceived = computed(() => transaction.value?.tx?.senderId !== transactionOwner);

    const direction = computed(() => isReceived.value ? TX_DIRECTION.received : TX_DIRECTION.sent);

    const assets = computed((): ITokenResolved[] => [{
      amount: amount.value,
      symbol: BTC_SYMBOL,
      name: BTC_PROTOCOL_NAME,
      isReceived: direction.value === TX_DIRECTION.received,
      contractId: adapter.coinContractId,
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
        transaction.value = await adapter.fetchTransactionByHash(hash, transactionOwner);
      } catch (e) {
        setLoaderVisible(false);
        router.push({ name: ROUTE_NOT_FOUND });
      }
    });

    return {
      PROTOCOLS,
      amount,
      amountTotal,
      fee,
      hash,
      assets,
      transaction,
    };
  },
});
</script>
