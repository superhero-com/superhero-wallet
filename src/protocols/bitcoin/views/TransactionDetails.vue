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

import { useAccounts } from '@/composables';
import type { ITransaction } from '@/types';
import { TX_DIRECTION, PROTOCOL_BITCOIN } from '@/constants';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { satoshiToBtc } from '@/protocols/bitcoin/helpers';
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
    const transactionOwner = route.params.transactionOwner as `bc${string}`;

    const transaction = ref<ITransaction>();

    const explorerUrl = computed(
      // TODO: link to the bitcoin explorer should be moved to the network settings
      () => `https://www.blockchain.com/explorer/transactions/btc/${transaction.value?.hash}`,
    );
    const transactionFee = computed((): number => satoshiToBtc(transaction.value?.tx?.fee ?? 0));
    const totalAmount = computed((): number => transaction.value?.tx
      ? satoshiToBtc(transaction.value.tx.fee + transaction.value.tx.amount)
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

    async function getBtcTransactionByHash() { // suppose to have hash as param
      return {
        hash: '4f65fc1abfe32f8ed404dcde07a0a5b9fdd070611603167a56130bbd322085e8',
        fee: 1153,
        txIndex: 8181070991696226,
        time: 1692168597,
        blockIndex: 803415,
        blockHeight: 803415,
        inputs: [
          {
            prevOut: {
              addr: 'bc1qcyxma4ww6axx4e8ctekl9rlyet6kl9ncheven7',
              spent: true,
              value: 2347000,
            },
          },
        ],
        out: [
          {
            spent: true,
            value: 2345847,
            addr: '1757VqqVDyXsUqjd1mwXEmWwFA6AqzaUdb',
          },
        ],
        result: -2347000,
        balance: 0,
      };
    }

    onMounted(async () => {
      try {
        const rawTransaction = await getBtcTransactionByHash();
        transaction.value = {
          hash: rawTransaction.hash,
          blockHeight: rawTransaction.blockHeight,
          microTime: rawTransaction.time * 1000,
          tx: {
            amount: rawTransaction.out[0].value,
            fee: rawTransaction.fee,
            recipientId: rawTransaction.out[0].addr,
            senderId: rawTransaction.inputs[0].prevOut.addr,
            type: 'SpendTx', // TODO: consider to not being dependent on the ae types/structure for other coins than ae
          },
          transactionOwner,
          totalAmount: Math.abs(rawTransaction.result),
        } as any;
      } catch (e) {
        router.push({ name: ROUTE_NOT_FOUND });
      }
    });

    return {
      BTC_SYMBOL,
      PROTOCOL_BITCOIN,
      direction,
      explorerUrl,
      getBtcTransactionByHash,
      hash,
      transaction,
      transactionFee,
      tokens,
      totalAmount,
    };
  },
});
</script>
