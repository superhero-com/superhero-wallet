<template>
  <div class="latest-transaction-card">
    <div class="title">
      {{ $t('dashboard.latest-transaction-card.title' ) }}
    </div>
    <TransactionItem
      v-for="transaction in latestTransactions"
      :key="transaction.hash"
      :transaction="transaction"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
} from '@vue/composition-api';
import TransactionItem from '../TransactionItem.vue';
import {
  IAccount,
  ITokenList,
  ITransaction,
} from '../../../types';
import {
  COUNT_OF_DASHBOARD_TRANSACTION,
  sortTransaction,
  watchUntilTruthy,
} from '../../utils';
import {
  useGetter,
  useState,
} from '../../../composables/vuex';

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: { TransactionItem },
  setup(_, { root }) {
    const latestTransactions = ref<ITransaction[]>([]);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');

    const accounts = useGetter<IAccount[]>('accounts');

    function isFungibleTokenTx(tr: ITransaction) {
      return Object.keys(availableTokens.value)
        .includes(tr.tx.contractId);
    }

    onMounted(async () => {
      await watchUntilTruthy(() => root.$store.state.middleware);

      const allTransactionsPromise = accounts.value.map((account) => (
        root.$store.state.middleware.getTxByAccount(account?.address, 3, 1)
      ));
      const allPendingTransactionsPromise = accounts.value.map((account) => (
        root.$store.dispatch('fetchPendingTransactions', account?.address)
      ));

      const allTransactions = await Promise.all(allTransactionsPromise);
      const allPendingTransactions = await Promise.all(allPendingTransactionsPromise);

      latestTransactions.value = [
        ...allTransactions.flatMap((t) => t.data),
        ...allPendingTransactions.flatMap((t) => t || []),
      ]
        .filter((t) => !t.tx.contractId || !isFungibleTokenTx(t))
        .sort(sortTransaction)
        .slice(0, COUNT_OF_DASHBOARD_TRANSACTION);
    });
    return {
      latestTransactions,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.latest-transaction-card {
  width: 100%;
  background-color: variables.$color-bg-6;
  border-radius: variables.$border-radius-interactive;
  padding: 8px 12px;

  .title {
    @extend %face-sans-15-bold;

    margin-bottom: 4px;
  }
}
</style>
