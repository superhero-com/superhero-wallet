<template>
  <IonContent class="ion-padding transaction-list">
    <div ref="innerScrollElem">
      <div
        v-if="isOnline || transactions.length"
        :key="activeAccount.address"
        class="transactions"
      >
        <InfiniteScroll
          class="list"
          data-cy="list"
          :virtual="true"
          :items="filteredTransactions"
          :key-extractor="txKey"
          @load-more="loadMore()"
        >
          <template #default="{ item }">
            <TransactionListItem
              :key="item.hash"
              :transaction="getTransaction(item)"
              :multisig-transaction="getMultisigTransaction(item)"
              :is-multisig="isMultisig"
            />
          </template>
        </InfiniteScroll>

        <AnimatedSpinner
          v-if="isLoading"
          class="spinner"
          data-cy="loader"
        />
        <p
          v-else-if="!filteredTransactions.length"
          class="message"
          v-text="$t('pages.recentTransactions.noTransactionsFound')"
        />
        <p
          v-else-if="isEndReached && filteredTransactions.length > 5"
          class="message"
          v-text="$t('pages.recentTransactions.transactionListEnd')"
        />
      </div>

      <MessageOffline
        v-if="!isOnline"
        class="offline-message"
        :text="$t('modals.accountDetails.transactionsNotAvailable')"
      />
    </div>
    <BackToTop />
  </IonContent>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { IonContent } from '@ionic/vue';
import { throttle } from 'lodash-es';

import type { ICommonTransaction, ITransaction } from '@/types';
import { FIXED_TABS_SCROLL_HEIGHT, TX_DIRECTION } from '@/constants';
import { pipe, sortTransactionsByDate, watchUntilTruthy } from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useConnection,
  useFungibleTokens,
  useScrollConfig,
  useTransactionAndTokenFilter,
  useViewport,
} from '@/composables';
import {
  resolveScrollableElementWithRetry,
} from '@/composables/viewport';

import {
  getInnerTransaction,
  getMultisigTransaction,
  getOwnershipStatus,
  getTransaction,
  getTxDirection,
  getTxOwnerAddress,
  isTxDex,
} from '@/protocols/aeternity/helpers';
import { AE_TRANSACTION_OWNERSHIP_STATUS } from '@/protocols/aeternity/config';

import MessageOffline from '@/popup/components/MessageOffline.vue';
import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?vue-component';
import InfiniteScroll from './InfiniteScroll.vue';
import BackToTop from './BackToTop.vue';

export default defineComponent({
  components: {
    TransactionListItem,
    AnimatedSpinner,
    InfiniteScroll,
    MessageOffline,
    IonContent,
    BackToTop,
  },
  props: {
    transactions: { type: Array as PropType<ICommonTransaction[]>, default: () => [] },
    isLoading: Boolean,
    isEndReached: Boolean, // TODO implement visual indication of the end of the list
    isMultisig: Boolean,
  },
  emits: [
    'load-more',
  ],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { accounts, activeAccount } = useAccounts();
    const { dexContracts } = useAeSdk();
    const { isOnline } = useConnection();
    const { setScrollConf } = useScrollConfig();
    const { initViewport, viewportElement } = useViewport();
    const { getTxAssetSymbol } = useFungibleTokens();
    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const scrollContainer = ref<HTMLElement | null>(null);
    let stopResolveRetry: (() => void) | undefined;

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );
    const onScroll = throttle(() => {
      appInnerScrollTop.value = scrollContainer.value?.scrollTop ?? 0;
    }, 200);

    const searchPhraseLowerCase = computed(() => searchPhrase.value.toLocaleLowerCase());

    function filterTransactionsByDisplayMode(transactionList: ICommonTransaction[]) {
      return transactionList.filter((transaction) => {
        const outerTx = transaction.tx!;
        const innerTx = transaction.tx ? getInnerTransaction(transaction.tx) : null;
        const txOwnerAddress = getTxOwnerAddress(innerTx);
        const isDex = isTxDex(innerTx, dexContracts.value);

        const direction = getTxDirection(
          outerTx?.payerId ? outerTx : innerTx,
          (transaction as ITransaction).transactionOwner
          || (
            (
              getOwnershipStatus(activeAccount.value, accounts.value, innerTx)
              !== AE_TRANSACTION_OWNERSHIP_STATUS.current
            )
            && txOwnerAddress
          )
          || activeAccount.value.address,
        );

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
      return transactionList.filter((transaction) => (
        !searchPhrase.value
        || transaction.tx?.contractId?.includes(searchPhraseLowerCase.value)
        || getTxAssetSymbol(transaction as ITransaction)?.toLocaleLowerCase()
          .includes(searchPhraseLowerCase.value)
      ));
    }

    const filteredTransactions = computed(
      () => pipe([
        filterTransactionsByDisplayMode,
        filterTransactionsBySearchPhrase,
        sortTransactionsByDate,
      ])(props.transactions),
    );
    function txKey(item: ICommonTransaction) {
      return (item as any).hash;
    }

    function loadMore() {
      if (!props.isLoading) {
        emit('load-more');
      }
    }

    async function checkLoadMore() {
      // nextTick is required because viewportElement scrollHeight
      // is not being changed fast enough, after filter is applied
      await nextTick();
      await watchUntilTruthy(() => !props.isLoading);
      if (viewportElement.value) {
        const {
          scrollHeight,
          scrollTop,
          clientHeight,
        } = viewportElement.value;

        if (scrollHeight - scrollTop <= clientHeight + 100) {
          loadMore();
          if (!props.isEndReached) {
            /**
             * checkLoadMore is needed to populate the list with the right transaction type.
             * For fungible tokens whose transactions were done long ago,
             * this will result in a huge number of requests to load all user
             *  transactions that were done after and sort them out.
             * TODO: Improve the fulfillment logic
             * by moving to filtering on the mdw side
             * and using the new fungible token endpoint https://github.com/aeternity/ae_mdw/issues/1678
             */
            checkLoadMore();
          }
        }
      }
    }

    watch(
      appInnerScrollTop,
      (value) => setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT),
    );

    watch(
      displayMode,
      () => checkLoadMore(),
    );

    onMounted(() => {
      setScrollConf(false);
      initViewport(appInnerElem.value!);
      stopResolveRetry = resolveScrollableElementWithRetry(
        appInnerElem.value ?? undefined,
        (resolved) => {
          const nextContainer = resolved as HTMLElement | null;
          if (scrollContainer.value === nextContainer) return;
          scrollContainer.value?.removeEventListener('scroll', onScroll);
          scrollContainer.value = nextContainer;
          scrollContainer.value?.addEventListener('scroll', onScroll);
        },
      );
    });

    onBeforeUnmount(() => {
      setScrollConf(false);
      stopResolveRetry?.();
      scrollContainer.value?.removeEventListener('scroll', onScroll);
    });

    return {
      activeAccount,
      isOnline,
      loadMore,
      innerScrollElem,
      filteredTransactions,
      txKey,
      getMultisigTransaction,
      getTransaction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

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

      color: $color-grey-light;
      text-align: center;
      padding: 48px 64px;
    }

    .spinner {
      width: 56px;
      min-height: 56px;
      margin: 0 auto;
      padding-bottom: 48px;
      color: $color-white;
    }
  }

  .offline-message {
    margin-top: 40px;
    margin-bottom: 100px; // Status bar spacer
  }
}
</style>
