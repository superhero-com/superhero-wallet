<template>
  <div class="transaction-list">
    <div
      v-if="showSearch && showSearchAndFilters"
      class="search-bar-wrapper"
    >
      <InputSearch
        v-model="searchTerm"
        :placeholder="$t('pages.recentTransactions.searchPlaceholder')"
      />
    </div>
    <Filters
      v-if="showSearchAndFilters"
      v-model="displayMode"
      :filters="filters"
      :scroll-top-threshold="scrollTopThreshold"
    />
    <div
      class="list"
      data-cy="list"
    >
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="transaction"
        :data-cy="transaction.pending && 'pending-txs'"
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
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import type {
  IAccount,
  INetwork,
  ITokenList,
  ITransaction,
  ObjectValues,
} from '../../types';
import {
  TXS_PER_PAGE,
  AETERNITY_CONTRACT_ID,
  MOBILE_WIDTH,
  watchUntilTruthy,
} from '../utils';
import { useGetter, useState } from '../../composables/vuex';
import Filters, { IFilterInputPayload, IFilters } from './Filters.vue';
import TransactionItem from './TransactionItem.vue';
import InputSearch from './InputSearch.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import Visible from '../../icons/visible.svg?vue-component';

const FILTER_MODE = {
  all: 'all',
  in: 'in',
  out: 'out',
  dex: 'dex',
} as const;

type TransactionsFilterMode = ObjectValues<typeof FILTER_MODE>;
type TransactionsFilters = IFilters<TransactionsFilterMode>;
type TransactionsFilterPayload = IFilterInputPayload<TransactionsFilterMode>;

export default defineComponent({
  components: {
    Filters,
    TransactionItem,
    InputSearch,
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
    const searchTerm = ref('');
    const displayMode = ref<TransactionsFilterPayload>({ rotated: true, key: FILTER_MODE.all });
    const filters = ref<TransactionsFilters>({
      all: { name: root.$t('filters.all') },
      in: { name: root.$t('filters.in') },
      out: { name: root.$t('filters.out') },
      dex: { name: root.$t('filters.dex') },
    });

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const transactions = useState('transactions');

    const getDexContracts = useGetter('getDexContracts');
    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const getAccountPendingTransactions = useGetter('getAccountPendingTransactions');
    const getTxSymbol = useGetter('getTxSymbol');

    function compareCaseInsensitive(
      str1: string,
      str2: string,
    ) {
      return str1.toLocaleLowerCase() === str2.toLocaleLowerCase();
    }

    function isFungibleTokenTx(tr: ITransaction) {
      return Object.keys(availableTokens.value)
        .includes(tr.tx.contractId);
    }

    const filteredTransactions = computed(
      () => [
        ...transactions.value.loaded,
        ...getAccountPendingTransactions.value,
      ]
        .filter((tr) => (!props.token
          || (props.token !== AETERNITY_CONTRACT_ID
            ? tr.tx?.contractId === props.token
            : (!tr.tx.contractId || !isFungibleTokenTx(tr)))))
        .filter((tr) => {
          switch (displayMode.value.key) {
            case FILTER_MODE.all:
              return true;
            case FILTER_MODE.dex:
              return getDexContracts.value && tr.tx.contractId && (
                getDexContracts.value.router.includes(tr.tx.contractId)
                || getDexContracts.value.wae?.includes(tr.tx.contractId)
              );
            case FILTER_MODE.out:
              return (compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                  && tr.tx.senderId === account.value.address)
                || (isFungibleTokenTx(tr)
                  && compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                  && tr.tx.callerId === account.value.address);
            case FILTER_MODE.in:
              return (compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.spend)
                  && (tr.tx.recipientId === account.value.address
                    || (tr.tx.senderId !== account.value.address
                      && tr.tx.recipientId.startsWith('nm_'))))
                || (isFungibleTokenTx(tr)
                  && compareCaseInsensitive(tr.tx.type, SCHEMA.TX_TYPE.contractCall)
                  && tr.recipient === account.value.address);
            default:
              throw new Error(`${root.$t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
          }
        })
        .filter(
          (tr) => !searchTerm.value
            || getTxSymbol.value(tr)
              .toLocaleLowerCase()
              .includes(
                searchTerm.value.toLocaleLowerCase(),
              ),
        )
        .sort((a, b) => {
          const [aMicroTime, bMicroTime] = [a, b].map((tr) => (new Date(tr.microTime)).getTime());
          return a.pending || (bMicroTime - aMicroTime);
        })
        .slice(0, props.maxLength || Infinity),
    );

    const showSearchAndFilters = computed(() => (
      props.showFilters
      || displayMode.value.key !== FILTER_MODE.all
      || searchTerm.value
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
        await root.$store.dispatch('fetchTransactions', { limit: TXS_PER_PAGE });
      } finally {
        loading.value = false;
      }
      checkLoadMore();
    }

    async function getLatest() {
      try {
        await root.$store.dispatch('fetchTransactions', { limit: 10, recent: true });
      } finally {
        loading.value = false;
      }
    }

    watch(displayMode, () => {
      checkLoadMore();
    });

    onMounted(() => {
      loadMore();
      const polling = setInterval(() => getLatest(), 10000);
      const appInner = document.querySelector('.app-inner')!;

      appInner.addEventListener('scroll', checkLoadMore);
      window.addEventListener('scroll', checkLoadMore);

      root.$once('hook:destroyed', () => {
        appInner.removeEventListener('scroll', checkLoadMore);
        window.removeEventListener('scroll', checkLoadMore);
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
      filters,
      searchTerm,
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

  .search-bar-wrapper {
    background: var(--screen-bg-color);
    margin-left: calc(-1 * var(--screen-padding-x));
    margin-right: calc(-1 * var(--screen-padding-x));
    padding-inline: var(--screen-padding-x);
  }
}
</style>
