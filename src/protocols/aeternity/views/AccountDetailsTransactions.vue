<template>
  <ion-page
    class="account-details-transactions"
  >
    <ion-content
      class="ion-padding"
    >
      <div
        ref="innerScrollElem"
      >
        <TransactionList
          v-if="isOnline"
          :loading="loading"
          :transactions="loadedTransactionList"
          @load-more="loadMore()"
        />
        <MessageOffline
          v-else
          class="offline-message"
          :text="$t('modals.accountDetails.transactionsNotAvailable')"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { IonContent, IonPage, onIonViewWillLeave } from '@ionic/vue';

import type { ICommonTransaction } from '@/types';
import { TXS_PER_PAGE } from '@/constants';
import {
  useAccounts,
  useConnection,
  useTransactionList,
  useUi,
  useScrollConfig,
} from '@/composables';

import MessageOffline from '@/popup/components/MessageOffline.vue';
import TransactionList from '@/popup/components/TransactionList.vue';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  setup() {
    /**
     * TODO Extract duplicated logic of this component
     * Some of the following code was taken from
     * `src/popup/pages/AccountDetailsMultisigTransactions.vue`
     * during the multichain development.
     */

    let polling: NodeJS.Timer | null;

    const FIXED_SCROLL_HEIGHT = 120;

    const store = useStore();

    const { isOnline } = useConnection();
    const { isAppActive } = useUi();
    const { activeAccount } = useAccounts({ store });
    const { setScrollConf } = useScrollConfig();

    const {
      getAccountAllTransactions,
      getAccountTransactionsState,
      fetchTransactions,
    } = useTransactionList({ store });

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const loading = ref(false);
    const isDestroyed = ref(false);

    const canLoadMore = computed(() => (
      !!getAccountTransactionsState(activeAccount.value.address).nextPageUrl
    ));

    const loadedTransactionList = computed(
      (): ICommonTransaction[] => getAccountAllTransactions(activeAccount.value.address!),
    );

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        await fetchTransactions(
          TXS_PER_PAGE,
          !!recent,
          activeAccount.value.address,
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value && !isDestroyed.value && canLoadMore.value) {
        await fetchTransactionList();
      }
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_SCROLL_HEIGHT);
      },
    );

    onMounted(() => {
      fetchTransactionList();
      polling = setInterval(() => {
        if (isAppActive.value) {
          fetchTransactionList(true);
        }
      }, 10000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
      isDestroyed.value = true;
    });

    onIonViewWillLeave(() => {
      setScrollConf(false);
    });

    return {
      isOnline,
      loading,
      loadedTransactionList,
      loadMore,
      innerScrollElem,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-transactions {
  --filter-top-offset: 175px;

  padding: 0 12px;

  :deep(.filters) {
    position: sticky;
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }

  .offline-message {
    margin-top: 40px;
  }
}
</style>
