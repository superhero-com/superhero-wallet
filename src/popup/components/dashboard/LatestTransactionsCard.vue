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
import { uniqBy } from 'lodash-es';
import TransactionItem from '../TransactionItem.vue';
import {
  IAccount,
  IDashboardTransaction,
  ITransaction,
} from '../../../types';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  sortTransactions,
  watchUntilTruthy,
} from '../../utils';
import {
  useGetter,
} from '../../../composables/vuex';

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: { TransactionItem },
  setup(_, { root, emit }) {
    const latestTransactions = ref<IDashboardTransaction[]>([]);

    // const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');

    const accounts = useGetter<IAccount[]>('accounts');

    // function isFungibleTokenTx(transaction: IDashboardTransaction) {
    //   return Object.keys(availableTokens.value).includes(transaction.tx.contractId);
    // }

    function assignTransactionToOwner(transaction: ITransaction, address: string) {
      return {
        ...transaction,
        transactionOwner: address,
      };
    }

    function prepareDashboardTransaction(
      callback: Function, address: string, resultKey?: string,
    ) {
      return callback().then((res: any) => {
        const result = resultKey ? res[resultKey] : res;
        console.log({ result, resultKey });
        return (
          result.map((transaction: ITransaction) => ({
            ...transaction,
            transactionOwner: address,
          }))
        );
      });
    }

    onMounted(async () => {
      await watchUntilTruthy(() => root.$store.state.middleware);

      // const allTransactionsPromise = accounts.value.map(({ address }) => (
      //   root.$store.state.middleware.getTxByAccount(address, DASHBOARD_TRANSACTION_LIMIT, 1)
      //     .then((res: any) => (
      //       res.data.map((transaction: ITransaction) => {
      //         console.log({ transaction });
      //         return (
      //           assignTransactionToOwner(transaction, address)
      //         );
      //       })
      //     ))
      // ));

      const allTransactionsPromise = accounts.value.map(({ address }) => (
        prepareDashboardTransaction(
          () => root.$store.state.middleware.getTxByAccount(
            address, DASHBOARD_TRANSACTION_LIMIT + 20,
            1,
          ),
          address,
          'data',
        )
      ));

      // eslint-disable-next-line no-unused-vars
      const allPendingTransactionsPromise = accounts.value.map(({ address }) => (
        root.$store.dispatch('fetchPendingTransactions', address).then((res) => (
          res.map((transaction: ITransaction) => (
            assignTransactionToOwner(transaction, address)
          ))
        ))
      ));

      // eslint-disable-next-line no-unused-vars
      const allTokenTransactionsPromise = accounts.value.map(({ address }) => (
        root.$store.dispatch('fungibleTokens/getTokensHistory', { address, multipleAccounts: true })
          .then((res) => (
            res.map((transaction: ITransaction) => (
              assignTransactionToOwner(transaction, address)
            ))
          ))
      ));

      const fetchTipWithdrawnTransactionsPromise = accounts.value.map(({ address }) => (
        root.$store.dispatch('fetchTipWithdrawnTransactions', { address, multipleAccounts: true })
          .then((res) => (
            res.map((transaction: ITransaction) => (
              assignTransactionToOwner(transaction, address)
            ))
          ))
      ));

      const allTransactions = await Promise.any([
        ...allTransactionsPromise,
        ...allPendingTransactionsPromise,
        ...allTokenTransactionsPromise,
        ...fetchTipWithdrawnTransactionsPromise,
      ]);

      latestTransactions.value = uniqBy(allTransactions
        .flat()
        .sort(sortTransactions),
      // .slice(0, DASHBOARD_TRANSACTION_LIMIT);
      'hash');

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
