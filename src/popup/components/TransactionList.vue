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
    <router-link
      v-if="maxLength && transactions.loaded.length > maxLength"
      to="/transactions"
      class="view-more"
    >
      <Visible class="icon" />
      <span class="text">
        {{ $t('pages.recentTransactions.viewMore') }}
      </span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import type {
  IAccount,
  INetwork,
  ITokenList,
} from '../../types';
import {
  TXS_PER_PAGE,
  AETERNITY_CONTRACT_ID,
  MOBILE_WIDTH,
  watchUntilTruthy,
  compareCaseInsensitive,
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
import { ITransaction } from '../../types';
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
  },
  setup(props, { root }) {
    const loading = ref(false);
    const isDestroyed = ref(false);

    const {
      activeMultisigAccount,
      isMultisigDashboard,
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

    const currentAddress = computed(() => isMultisigDashboard.value
      ? activeMultisigAccount.value?.address
      : account.value.address);

    const filteredTransactions = computed(
      () => {
        const transactionListLocal = [
          ...getAccountPendingTransactions.value,
          ...transactions.value.loaded,
        ];

        if (isMultisigDashboard.value && pendingMultisigTransaction.value?.tx) {
          transactionListLocal.push(pendingMultisigTransaction.value);
        }

        return transactionListLocal
          .filter((tr) => (
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
                          && tr.tx.recipientId.startsWith('nm_')
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
          .sort((a, b) => {
            const [aMicroTime, bMicroTime] = [a, b].map((tr) => (new Date(tr.microTime)).getTime());
            const pending = (a.pending && !b.pending && -1) || (b.pending && !a.pending && 1);

            const compareMicroTime = () => {
              const withoutTimeIndex = [aMicroTime, bMicroTime].findIndex(
                (time) => Number.isNaN(time),
              );

              if (withoutTimeIndex === 0) {
                return -1;
              }
              if (withoutTimeIndex === 1) {
                return 1;
              }
              return bMicroTime - aMicroTime;
            };

            return pending || compareMicroTime();
          })
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

    async function loadMore() {
      if (loading.value) return;
      loading.value = true;
      try {
        await watchUntilTruthy(() => root.$store.state.middleware);
        await root.$store.dispatch('fetchTransactions', { limit: TXS_PER_PAGE, address: currentAddress.value });
      } finally {
        loading.value = false;
      }
      checkLoadMore();
    }

    async function getLatest() {
      try {
        await root.$store.dispatch('fetchTransactions', { limit: 10, recent: true, address: currentAddress.value });
      } finally {
        loading.value = false;
      }
    }

    watch(displayMode, () => {
      checkLoadMore();
    });

    onMounted(async () => {
      loadMore();
      const polling = setInterval(() => getLatest(), 10000);
      root.$once('hook:destroyed', () => {
        clearInterval(polling);
        isDestroyed.value = true;
      });
    });

    return {
      loading,
      isDestroyed,
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
