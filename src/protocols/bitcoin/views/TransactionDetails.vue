<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="transaction-details">
        <template v-if="transaction">
          <TransactionDetailsBase
            :amount="getTxAmountTotal(transaction, true)"
            :transaction="transaction"
            :coin-symbol="BTC_SYMBOL"
            :transaction-fee="transactionFee"
            :token-symbol="BTC_SYMBOL"
            :total-amount="totalAmount"
            :explorer-url="explorerUrl"
            :hash="hash"
            :none-ae-coin="tokens"
            :protocol="PROTOCOLS.bitcoin"
            show-header
          >
            <template #tokens>
              <TransactionTokens
                :ext-tokens="tokens"
                :is-rounded="!!tokens"
                :transaction="transaction"
                :direction="direction"
                icon-size="md"
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

import type { ITransaction } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { TX_DIRECTION, PROTOCOLS } from '@/constants';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { getTxAmountTotal } from '@/protocols/bitcoin/helpers';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { useUi } from '@/composables';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import TransactionTokens from '@/popup/components/TransactionTokenRows.vue';
import BtcIcon from '@/icons/coin/bitcoin.svg';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    TransactionTokens,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { setLoaderVisible } = useUi();

    const hash = route.params.hash as string;

    const transactionOwner = route.params.transactionOwner as string;

    const transaction = ref<ITransaction>();

    const explorerUrl = computed(
      () => ProtocolAdapterFactory
        .getAdapter(PROTOCOLS.bitcoin)
        .getExplorer()
        .prepareUrlForHash(transaction.value?.hash),
    );

    const transactionFee = computed((): number => transaction.value?.tx?.fee ?? 0);

    const totalAmount = computed((): number => transaction.value?.tx
      ? getTxAmountTotal(transaction.value, transaction.value.tx.senderId !== transactionOwner)
      : 0);

    const direction = computed(() => transactionOwner === transaction.value?.tx?.senderId
      ? TX_DIRECTION.sent
      : TX_DIRECTION.received);

    const tokens = computed(() => [{
      amount: totalAmount.value,
      symbol: BTC_SYMBOL,
      isReceived: direction.value === TX_DIRECTION.received,
      isAe: false,
      image: BtcIcon,
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
        const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);
        transaction.value = {
          ...await bitcoinAdapter.getTransactionByHash(hash),
          transactionOwner,
        };
      } catch (e) {
        router.push({ name: ROUTE_NOT_FOUND });
      }
    });

    return {
      BTC_SYMBOL,
      PROTOCOLS,
      direction,
      explorerUrl,
      hash,
      transaction,
      transactionFee,
      tokens,
      totalAmount,
      getTxAmountTotal,
    };
  },
});
</script>
