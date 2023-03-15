<template>
  <div
    v-if="showWidget"
    class="latest-transaction-card"
  >
    <div class="title">
      {{ $t('dashboard.latestTransactionCard.title') }}
    </div>

    <Transition name="page-transition">
      <AnimatedSpinner
        v-if="isLoading"
        class="spinner"
      />
      <div v-else>
        <TransactionItem
          v-for="transaction in latestTransactions"
          :key="`${transaction.transactionOwner}-${transaction.hash}`"
          :transaction="transaction"
          show-transaction-owner
        />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
} from '@vue/composition-api';
import { uniqWith } from 'lodash-es';
import type {
  IAccount,
  ITransaction,
} from '../../types';
import { useDispatch, useGetter, useState } from '../../composables/vuex';
import { useBalances, useConnection, useMiddleware } from '../../composables';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  handleUnknownError,
  defaultTransactionSortingCallback,
  MDW_TO_NODE_APPROX_DELAY_TIME,
} from '../utils';
import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

// eslint-disable-next-line no-unused-vars
type CallbackFunction = (payload: string | { address: string, multipleAccounts: boolean })
  => Promise<ITransaction[] | { data: ITransaction[]}>

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: {
    TransactionItem,
    AnimatedSpinner,
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { balancesTotal } = useBalances({ store: root.$store });
    const { getMiddleware } = useMiddleware({ store: root.$store });

    const latestTransactions = ref<ITransaction[]>([]);
    const isLoading = ref<boolean>(true);

    const showWidget = computed(
      () => isOnline.value && (isLoading.value || latestTransactions.value.length),
    );
    const accounts = useGetter<IAccount[]>('accounts');
    const activeIdx = useState('accounts', 'activeIdx');
    const fetchPendingTransactions = useDispatch('fetchPendingTransactions');
    const getTokensHistory = useDispatch('fungibleTokens/getTokensHistory');
    const fetchTipWithdrawnTransactions = useDispatch('fetchTipWithdrawnTransactions');

    function fetchForAllAccount(func: CallbackFunction, isMultiple?: boolean) {
      const fetchForAccount = async (address: string) => {
        try {
          const res = await func(isMultiple ? { address, multipleAccounts: true } : address);
          return (Array.isArray(res) ? res : res?.data).map(
            (transaction: ITransaction) => ({
              ...transaction,
              transactionOwner: address,
            }),
          );
        } catch (e) {
          handleUnknownError(e);
          return [];
        }
      };

      return accounts.value.map(({ address }) => fetchForAccount(address));
    }

    async function updateData() {
      const middleware = await getMiddleware();
      const getTxByAccountAddress = (address: string) => (
        middleware.getTxByAccount(address, DASHBOARD_TRANSACTION_LIMIT, 1)
      );

      const allTransactionsPromises = [
        ...fetchForAllAccount(getTxByAccountAddress as CallbackFunction),
        ...fetchForAllAccount(fetchPendingTransactions),
        ...fetchForAllAccount(getTokensHistory, true),
        ...fetchForAllAccount(fetchTipWithdrawnTransactions, true),
      ];

      const allTransactions = await Promise.all(allTransactionsPromises);

      latestTransactions.value = uniqWith(allTransactions.flat(), (a, b) => (
        a.hash === b.hash && a.transactionOwner === b.transactionOwner
      ))
        .sort(defaultTransactionSortingCallback)
        .slice(0, DASHBOARD_TRANSACTION_LIMIT);

      isLoading.value = false;
    }

    // To avoid unnecessary data transfers instead of constant polling
    // we are fetching the transactions only if the total balance of the accounts changes.
    watch(
      balancesTotal,
      (val, oldVal) => {
        if (!latestTransactions.value.length || val !== oldVal) {
          setTimeout(() => updateData(), MDW_TO_NODE_APPROX_DELAY_TIME);
        }
      },
      { immediate: true },
    );

    return {
      latestTransactions,
      showWidget,
      activeIdx,
      isLoading,
      balancesTotal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

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

  .offline-message {
    margin: auto;
    padding-block: 10px;
  }

  .spinner {
    align-self: center;
    height: 60px;
  }
}
</style>
