<template>
  <IonContent class="ion-padding ion-content-bg--lighter transaction-list">
    <div ref="innerScrollElem">
      <div
        v-if="isOnline"
        :key="activeAccount.address"
        class="transactions"
      >
        <InfiniteScroll
          class="list"
          data-cy="list"
          is-more-data
          @loadMore="loadMore()"
        >
          <TransactionListItem
            v-for="transaction in filteredTransactions"
            :key="transaction.hash"
            :transaction="getTransaction(transaction)"
            :multisig-transaction="getMultisigTransaction(transaction)"
            :is-multisig="isMultisig"
          />
        </InfiniteScroll>
        <AnimatedSpinner
          v-show="loading"
          class="spinner"
          data-cy="loader"
        />
        <div
          v-if="!loading && !filteredTransactions.length"
          class="message"
        >
          <p v-text="$t('pages.recentTransactions.noTransactionsFound')" />
        </div>
      </div>
      <MessageOffline
        v-else
        class="offline-message"
        :text="$t('modals.accountDetails.transactionsNotAvailable')"
      />
    </div>
  </IonContent>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onUnmounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { IonContent } from '@ionic/vue';
import { throttle } from 'lodash-es';

import type { ICommonTransaction, IonicLifecycleStatus, ITransaction } from '@/types';
import { FIXED_TABS_SCROLL_HEIGHT, TX_DIRECTION } from '@/constants';
import {
  useAccounts,
  useAeSdk,
  useConnection,
  useFungibleTokens,
  useScrollConfig,
  useTransactionAndTokenFilter,
  useUi,
  useViewport,
} from '@/composables';
import {
  getInnerTransaction,
  getMultisigTransaction,
  getOwnershipStatus,
  getTransaction,
  getTxDirection,
  getTxOwnerAddress,
  isTxDex,
} from '@/protocols/aeternity/helpers';

import {
  includesCaseInsensitive,
  pipe,
  sortTransactionsByDate,
} from '@/utils';

import { AE_TRANSACTION_OWNERSHIP_STATUS } from '@/protocols/aeternity/config';

import MessageOffline from '@/popup/components/MessageOffline.vue';
import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import InfiniteScroll from './InfiniteScroll.vue';

export default defineComponent({
  components: {
    TransactionListItem,
    AnimatedSpinner,
    InfiniteScroll,
    MessageOffline,
    IonContent,
  },
  props: {
    canLoadMore: { type: Boolean },
    fetchRecentTransactions: { type: Function, required: true },
    fetchMoreTransactions: { type: Function, required: true },
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
    isMultisig: Boolean,
    transactions: { type: Array as PropType<ICommonTransaction[]>, default: () => [] },
  },
  setup(props) {
    let pollingInterval: NodeJS.Timer | null;

    const store = useStore();
    const { t } = useI18n();
    const { accounts, activeAccount } = useAccounts();
    const { dexContracts } = useAeSdk({ store });
    const { isOnline } = useConnection();
    const { isAppActive } = useUi();
    const { setScrollConf } = useScrollConfig();
    const { initViewport, viewportElement } = useViewport();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const loading = ref(false);
    const isDestroyed = ref(false);

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        if (recent) {
          await props.fetchRecentTransactions();
        } else {
          await props.fetchMoreTransactions();
        }
      } finally {
        loading.value = false;
      }
    }

    function loadMore() {
      if (!loading.value && !isDestroyed.value && props.canLoadMore) {
        fetchTransactionList();
      }
    }

    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const { getTxSymbol } = useFungibleTokens({ store });

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
            getTxSymbol(getTransaction(transaction)),
            searchPhrase.value.toLocaleLowerCase(),
          )
        ),
      );
    }

    function checkLoadMore() {
      if (!viewportElement.value) {
        return;
      }

      const {
        scrollHeight,
        scrollTop,
        clientHeight,
      } = viewportElement.value!;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMore();
      }
    }

    const filteredTransactions = computed(
      () => pipe([
        filterTransactionsByDisplayMode,
        filterTransactionsBySearchPhrase,
        sortTransactionsByDate,
      ])(props.transactions),
    );

    function throttledScroll() {
      return throttle(() => {
        appInnerScrollTop.value = appInnerElem?.value?.scrollTop ?? 0;
      }, 200);
    }

    function onViewDidLeaveHandler() {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setScrollConf(false);
    }

    watch(displayMode, checkLoadMore);

    watch(loading, (val) => {
      if (!val) {
        checkLoadMore();
      }
    });

    watch(
      appInnerScrollTop,
      (value) => setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT),
    );

    watch(
      () => props.ionicLifecycleStatus,
      (value) => {
        // didEnter is always called, willEnter is only called when switching tabs
        if (value === 'didEnter') {
          // reset state since component might not have been unmounted
          loading.value = false;
          setScrollConf(false);
          initViewport(appInnerElem.value!);
          if (innerScrollElem.value && appInnerElem.value) {
            appInnerElem.value.addEventListener('scroll', throttledScroll());
          }
          fetchTransactionList();
          pollingInterval = setInterval(() => {
            if (isAppActive.value) {
              fetchTransactionList(true);
            }
          }, 10000);
          return;
        }

        if (props.ionicLifecycleStatus === 'didLeave') {
          onViewDidLeaveHandler();
        }
      },
    );

    onUnmounted(onViewDidLeaveHandler);

    return {
      activeAccount,
      isOnline,
      loading,
      loadMore,
      innerScrollElem,
      fetchTransactionList,
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
  .transactions {
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

  .offline-message {
    margin-top: 40px;
  }
}
</style>
