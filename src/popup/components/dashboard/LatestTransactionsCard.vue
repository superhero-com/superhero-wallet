<template>
  <div class="latest-transaction-card">
    <div class="title">
      {{ $t('dashboard.latest-transaction-card.title' ) }}
    </div>
    <TransactionItem
      v-for="transaction in latestTransactions"
      :key="`${transaction.transactionOwner}-${transaction.hash}`"
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
  IDashboardTransaction,
  ITokenList,
  ITransaction,
} from '../../../types';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  sortTransactions,
  watchUntilTruthy,
} from '../../utils';
import {
  useGetter,
  useState,
} from '../../../composables/vuex';

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: { TransactionItem },
  setup(_, { root, emit }) {
    const latestTransactions = ref<IDashboardTransaction[]>([]);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');

    const accounts = useGetter<IAccount[]>('accounts');

    function isFungibleTokenTx(transaction: IDashboardTransaction) {
      return Object.keys(availableTokens.value).includes(transaction.tx.contractId);
    }

    function assignTransactionToOwner(transaction: ITransaction, address: string) {
      return {
        ...transaction,
        transactionOwner: address,
      };
    }

    onMounted(async () => {
      await watchUntilTruthy(() => root.$store.state.middleware);

      const allTransactionsPromise = accounts.value.map((account) => (
        root.$store.state.middleware.getTxByAccount(account?.address, 3, 1).then((res: any) => (
          res.data.map((transaction: ITransaction) => {
            console.log({ transaction });
            return (
              assignTransactionToOwner(transaction, account.address)
            );
          })
        ))
      ));
      const allPendingTransactionsPromise = accounts.value.map((account) => (
        root.$store.dispatch('fetchPendingTransactions', account?.address).then((res) => (
          res.map((transaction: ITransaction) => (
            assignTransactionToOwner(transaction, account.address)
          ))
        ))
      ));

      const allTransactions = await Promise.all([
        ...allTransactionsPromise,
        ...allPendingTransactionsPromise,
      ]);

      latestTransactions.value = [...allTransactions]
        .flat()
        .filter((t) => !t.tx.contractId || !isFungibleTokenTx(t))
        .sort(sortTransactions)
        .slice(0, DASHBOARD_TRANSACTION_LIMIT);

      console.log('loaded');
      emit('loaded');
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
  display: flex;
  flex-direction: column;

  .title {
    @extend %face-sans-15-bold;

    margin-bottom: 4px;
  }

  .spinner {
    align-self: center;
    height: 186px;
  }
}
</style>
