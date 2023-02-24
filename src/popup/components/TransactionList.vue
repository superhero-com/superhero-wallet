<template>
  <div class="transaction-list">
    <InfiniteScroll
      class="list"
      data-cy="list"
      is-more-data
      @loadMore="loadMore"
    >
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="!transaction.isMultisigTransaction ? transaction : null"
        :multisig-transaction="transaction.isMultisigTransaction ? transaction : null"
        :is-multisig="isMultisig"
        :data-cy="transaction.pending && 'pending-txs'"
      />
    </InfiniteScroll>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
      data-cy="loader"
    />
    <div
      v-else-if="!filteredTransactions.length"
      class="message"
    >
      <p>
        {{ $t('pages.recentTransactions.noTransactionsFound') }}
      </p>
    </div>
    <RouterLink
      v-if="maxLength && transactions.loaded.length > maxLength"
      to="/transactions"
      class="view-more"
    >
      <Visible class="icon" />
      <span class="text">
        {{ $t('pages.recentTransactions.viewMore') }}
      </span>
    </RouterLink>
  </div>
</template>

<script lang="ts">
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from '@vue/composition-api';
import type {
  IAccount,
  INetwork,
  ITokenList,
  ITransaction,
} from '../../types';
import {
  TXS_PER_PAGE,
  AETERNITY_CONTRACT_ID,
  MOBILE_WIDTH,
  watchUntilTruthy,
  compareCaseInsensitive,
  defaultTransactionSortingCallback,
  isAensName,
} from '../utils';
import { useGetter, useState } from '../../composables/vuex';
import {
  useMultisigAccounts,
  usePendingMultisigTransaction,
  useTransactionAndTokenFilter,
} from '../../composables';

import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import Visible from '../../icons/visible.svg?vue-component';
import InfiniteScroll from './InfiniteScroll.vue';

export default defineComponent({
  components: {
    InfiniteScroll,
    TransactionItem,
    AnimatedSpinner,
    Visible,
  },
  props: {
    token: { type: String, default: '' },
    maxLength: { type: Number, default: null },
    scrollTopThreshold: { type: Number, default: undefined },
    showFilters: Boolean,
    showSearch: Boolean,
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const loading = ref(false);
    const isDestroyed = ref(false);
    let polling: NodeJS.Timeout | null = null;

    const {
      activeMultisigAccount,
    } = useMultisigAccounts({ store: root.$store });

    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const transactions = useState('transactions');

    const getDexContracts = useGetter('getDexContracts');
    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const getAccountPendingTransactions = useGetter('getAccountPendingTransactions');
    const getTxSymbol = useGetter('getTxSymbol');

    function isFungibleTokenTx(tr: ITransaction) {
      return Object.keys(availableTokens.value).includes(tr.tx.contractId);
    }

    const currentAddress = computed(() => props.isMultisig
      ? activeMultisigAccount.value?.gaAccountId
      : account.value.address);

    const filteredTransactions = computed(
      () => {
        const transactionListLocal = [
          ...getAccountPendingTransactions.value,
          ...transactions.value.loaded,
        ];

        if (props.isMultisig && pendingMultisigTransaction.value?.tx) {
          transactionListLocal.push(pendingMultisigTransaction.value);
        }

        return transactionListLocal
          .filter((tr: ITransaction) => (
            !props.token
            || (
              props.token !== AETERNITY_CONTRACT_ID
                ? tr.tx?.contractId === props.token
                : (!tr.tx.contractId || !isFungibleTokenTx(tr))
            )
          ))
          .filter((tr) => {
            switch (displayMode.value.key) {
              case FILTER_MODE.all:
                return true;
              case FILTER_MODE.dex:
                return (
                  getDexContracts.value && tr.tx.contractId
                  && (
                    getDexContracts.value.router.includes(tr.tx.contractId)
                    || getDexContracts.value.wae?.includes(tr.tx.contractId)
                  )
                );
              case FILTER_MODE.out:
                return (
                  compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                  && tr.tx.senderId === currentAddress.value
                ) || (
                  isFungibleTokenTx(tr)
                  && compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                  && tr.tx.callerId === currentAddress.value
                );
              case FILTER_MODE.in:
                return (
                  compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                  && (
                    tr.tx.recipientId === currentAddress.value
                    || (
                      tr.tx.senderId !== currentAddress.value
                      && isAensName(tr.tx.recipientId)
                    )
                  )
                ) || (
                  isFungibleTokenTx(tr)
                  && compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                  && tr.recipient === currentAddress.value
                );
              default:
                throw new Error(`${root.$t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
            }
          })
          .filter(
            (tr) => !searchPhrase.value || getTxSymbol.value(tr)
              .toLocaleLowerCase()
              .includes(searchPhrase.value.toLocaleLowerCase()),
          )
          .sort(defaultTransactionSortingCallback)
          .slice(0, props.maxLength || Infinity);
      },
    );

    const showSearchAndFilters = computed(() => (
      props.showFilters
      || displayMode.value.key !== FILTER_MODE.all
      || searchPhrase.value
    ));

    function checkLoadMore() {
      if (isDestroyed.value || !transactions.value.nextPageUrl) return;
      // TODO - use viewport.ts composable after rewriting component to Vue 3
      const isDesktop = document.documentElement.clientWidth > MOBILE_WIDTH
        || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = (isDesktop
        ? document.querySelector('.app-inner') : document.documentElement)!;
      if (props.maxLength && filteredTransactions.value.length >= props.maxLength) return;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        // eslint-disable-next-line no-use-before-define
        loadMore();
      }
    }

    async function loadMore(recent: boolean = false) {
      if (isDestroyed.value || loading.value) {
        return;
      }
      loading.value = true;
      try {
        await watchUntilTruthy(() => root.$store.state.middleware);
        await root.$store.dispatch('fetchTransactions', {
          limit: recent ? 10 : TXS_PER_PAGE,
          recent,
          address: currentAddress.value,
        });
      } finally {
        loading.value = false;
      }
      checkLoadMore();
    }

    watch(displayMode, () => {
      checkLoadMore();
    });

    onMounted(async () => {
      await loadMore();
      polling = setInterval(() => loadMore(true), 10000);
    });

    onUnmounted(() => {
      clearInterval(polling!);
      isDestroyed.value = true;
    });

    return {
      loading,
      displayMode,
      availableTokens,
      transactions,
      account,
      activeNetwork,
      getAccountPendingTransactions,
      getTxSymbol,
      filteredTransactions,
      showSearchAndFilters,
      loadMore,
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
    padding-bottom: 48px;
  }

  .message > p {
    padding: 48px 64px 0;

    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
  }

  .spinner {
    width: 56px;
    min-height: 56px;
    margin: 0 auto;
    color: variables.$color-white;
  }

  .view-more {
    padding: 12px 16px;
    border-radius: 4px;
    background: variables.$color-bg-1;
    display: flex;
    align-items: center;

    .text {
      @extend %face-sans-14-medium;

      color: variables.$color-success;
      padding-left: 4px;
    }

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      background: variables.$color-bg-2;

      .text {
        color: variables.$color-success-hover;
      }

      .icon {
        opacity: 1;

        path {
          fill: variables.$color-success;
        }
      }
    }

    &:active {
      background: variables.$color-bg-1;

      .text {
        opacity: 0.7;
      }

      .icon {
        opacity: 0.44;
      }
    }
  }
}
</style>
