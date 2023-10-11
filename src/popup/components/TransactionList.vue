<template>
  <div
    :key="activeAccount.address"
    class="transaction-list"
  >
    <div
      class="list"
      data-cy="list"
    >
      <TransactionListItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="getTransaction(transaction)"
        :multisig-transaction="getMultisigTransaction(transaction)"
        :is-multisig="isMultisig"
      />
    </div>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
      data-cy="loader"
    />
    <div
      v-else-if="!filteredTransactions.length"
      class="message"
    >
      <p v-text="$t('pages.recentTransactions.noTransactionsFound')" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import type {
  ICommonTransaction,
  ITransaction,
} from '@/types';
import { TX_DIRECTION } from '@/constants';
import {
  includesCaseInsensitive,
  pipe,
  sortTransactionsByDate,
} from '@/utils';
import { useGetter } from '@/composables/vuex';
import {
  useAccounts,
  useAeSdk,
  useTransactionAndTokenFilter,
} from '@/composables';
import { AE_TRANSACTION_OWNERSHIP_STATUS } from '@/protocols/aeternity/config';
import {
  getInnerTransaction,
  getMultisigTransaction,
  getOwnershipStatus,
  getTransaction,
  getTxDirection,
  getTxOwnerAddress,
  isTxDex,
} from '@/protocols/aeternity/helpers';

import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

export default defineComponent({
  components: {
    TransactionListItem,
    AnimatedSpinner,
  },
  props: {
    transactions: { type: Array as PropType<ICommonTransaction[]>, default: () => [] },
    tokenContractId: { type: String, default: '' },
    isMultisig: Boolean,
    loading: Boolean,
  },
  emits: ['loadMore'],
  setup(props) {
    const store = useStore();
    const { t } = useI18n();
    const { accounts, activeAccount } = useAccounts();
    const { dexContracts } = useAeSdk({ store });

    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const getTxSymbol = useGetter('getTxSymbol');

    function filterTransactionsByDisplayMode(transactionList: ICommonTransaction[]) {
      return transactionList.filter((transaction) => {
        const outerTx = transaction.tx!;
        const innerTx = transaction.tx ? getInnerTransaction(transaction.tx) : null;

        const txOwnerAddress = getTxOwnerAddress(innerTx);

        const direction = getTxDirection(
          outerTx?.payerId ? outerTx : innerTx,
          (transaction as ITransaction).transactionOwner
          || ((
            getOwnershipStatus(activeAccount.value, accounts.value, innerTx)
            !== AE_TRANSACTION_OWNERSHIP_STATUS.current
          ) && txOwnerAddress
          )
          || activeAccount.value.address,
        );

        const isDex = isTxDex(innerTx, dexContracts.value);

        switch (displayMode.value.key) {
          case FILTER_MODE.all:
            return true;
          case FILTER_MODE.dex:
            return isDex;
          case FILTER_MODE.out:
            return direction === TX_DIRECTION.sent && !isDex;
          case FILTER_MODE.in:
            return direction === TX_DIRECTION.received;
          default:
            throw new Error(`${t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
        }
      });
    }

    function filterTransactionsBySearchPhrase(transactionList: ICommonTransaction[]) {
      return transactionList.filter(
        (transaction) => (
          !searchPhrase.value
          || includesCaseInsensitive(
            getTxSymbol.value(transaction),
            searchPhrase.value.toLocaleLowerCase(),
          )
        ),
      );
    }

    // function checkLoadMore() {
    //   const scrollElement = scrollElementChild.value?.closest('ion-content');
    //   if (!scrollElement) {
    //     return;
    //   }

    //   console.log('scrollElement', scrollElement);

    //   const {
    //     scrollHeight,
    //     scrollTop,
    //     clientHeight,
    //   } = scrollElement!;

    //   // TODO USE IONIC INFINITE SCROLL COMPONENT
    //   console.log('checkLoadMore', scrollHeight, scrollTop, clientHeight);
    //   if (scrollHeight === 0 && clientHeight === 0 && scrollTop === 0) {
    //     return;
    //   }
    //   if (scrollHeight - scrollTop <= clientHeight + 100) {
    //     console.log('load  more');
    //     emit('loadMore');
    //   }
    // }

    watch(displayMode, () => {
      // checkLoadMore();
    });

    watch(() => props.loading, (val) => {
      if (!val) {
        // checkLoadMore();
      }
    });

    const filteredTransactions = computed(
      () => pipe([
        filterTransactionsByDisplayMode,
        filterTransactionsBySearchPhrase,
        sortTransactionsByDate,
      ])(props.transactions),
    );

    return {
      activeAccount,
      filteredTransactions,
      getMultisigTransaction,
      getTransaction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-list {
  display: flex;
  flex-direction: column;
  padding: 10px 0;

  .list {
    padding: 0;
    margin: 0;
  }

  .message,
  .spinner {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .message {
    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
    padding: 48px 64px 0;
  }

  .spinner {
    width: 56px;
    min-height: 56px;
    margin: 0 auto;
    padding-bottom: 48px;
    color: variables.$color-white;
  }
}
</style>
