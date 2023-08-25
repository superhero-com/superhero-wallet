<template>
  <div class="transaction-details">
    <Loader v-if="!transaction" />
    <template v-else>
      <TransactionDetailsBase
        :transaction="transaction"
        :coin-symbol="BTC_SYMBOL"
        :transaction-fee="transactionFee"
        :token-symbol="BTC_SYMBOL"
        :total-amount="totalAmount"
        :direction="direction"
        :explorer-url="explorerUrl"
        :is-local-account-address="isLocalAccountAddress"
        :hash="hash"
        :none-ae-coin="tokens"
        :protocol="PROTOCOL_BITCOIN"
      />
    </template>
    <div />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAccounts } from '@/composables';
import type { ITransaction } from '@/types';
import { TX_DIRECTION, PROTOCOL_BITCOIN } from '@/constants';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { toBitcoin } from 'satoshi-bitcoin';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import BtcIcon from '@/icons/coin/bitcoin.svg';

export default defineComponent({
  components: {
    TransactionDetailsBase,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();

    const { activeAccount } = useAccounts({ store });

    const hash = route.params.hash as string;

    const transactionOwner = route.params.transactionOwner as string;

    const transaction = ref<ITransaction>();

    const explorerUrl = computed(
      // TODO: link to the bitcoin explorer should be moved to the network settings
      () => `https://www.blockchain.com/explorer/transactions/btc/${transaction.value?.hash}`,
    );
    const transactionFee = computed((): number => toBitcoin(transaction.value?.tx?.fee ?? 0));
    const totalAmount = computed((): number => transaction.value?.tx
      ? toBitcoin(transaction.value.tx.fee + transaction.value.tx.amount)
      : 0);

    const direction = computed(() => activeAccount.value.address === transaction.value?.tx?.senderId
      ? TX_DIRECTION.sent
      : TX_DIRECTION.received);

    const tokens = computed(() => [{
      amount: totalAmount.value,
      symbol: BTC_SYMBOL,
      isReceived: false,
      isAe: false,
      image: BtcIcon,
    }]);

    onMounted(async () => {
      try {
        const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);
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
      PROTOCOL_BITCOIN,
      direction,
      explorerUrl,
      hash,
      transaction,
      transactionFee,
      tokens,
      totalAmount,
    };
  },
});
</script>
