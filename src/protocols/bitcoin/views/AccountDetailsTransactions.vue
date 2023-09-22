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
          :transactions="transactions"
          :loading="loading"
          @load-more="loadMoreTransactions()"
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
import { throttle } from 'lodash-es';
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';

import type { ITransaction } from '@/types';
import { PROTOCOL_BITCOIN, FIXED_TABS_SCROLL_HEIGHT } from '@/constants';
import { useAccounts, useConnection, useScrollConfig } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransactionList from '@/popup/components/TransactionList.vue';
import MessageOffline from '@/popup/components/MessageOffline.vue';
import { executeAndSetInterval } from '@/utils';
import Logger from '@/lib/logger';

export default defineComponent({
  components: {
    TransactionList,
    MessageOffline,
    IonPage,
    IonContent,
  },
  setup() {
    let pollingInterval: NodeJS.Timer;

    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);

    const store = useStore();
    const { isOnline } = useConnection();
    const { activeAccount } = useAccounts({ store });
    const { setScrollConf } = useScrollConfig();

    const innerScrollElem = ref<HTMLElement>();
    const appInnerScrollTop = ref<number>(0);
    const transactionsLatest = ref<ITransaction[]>([]);
    const transactionsMore = ref<ITransaction[]>([]);
    const loading = ref(false);

    const transactions = computed(() => [
      ...transactionsLatest.value || [],
      ...transactionsMore.value || [],
    ]);

    const appInnerElem = computed<HTMLElement | null | undefined>(
      () => innerScrollElem.value?.parentElement,
    );

    async function fetchTransactionList() {
      if (!loading.value) {
        try {
          loading.value = true;
          transactionsLatest.value = await adapter.fetchTransactions(activeAccount.value.address);
        } catch (error: any) {
          Logger.write(error);
        } finally {
          loading.value = false;
        }
      }
    }

    async function loadMoreTransactions() {
      const latestTxId: string = (transactionsMore.value.length)
        ? transactionsMore.value[transactionsMore.value.length - 1].hash
        : transactionsLatest.value[transactionsLatest.value.length - 1].hash;

      if (latestTxId) {
        try {
          const result = await adapter.fetchTransactions(activeAccount.value.address, latestTxId);
          if (result?.length) {
            transactionsMore.value = [...transactionsMore.value, result];
          }
        } catch (error: any) {
          Logger.write(error);
        }
      }
    }

    function throttledScroll() {
      return throttle(() => {
        appInnerScrollTop.value = appInnerElem?.value?.scrollTop ?? 0;
      }, 200);
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    onMounted(() => {
      if (innerScrollElem.value && appInnerElem.value) {
        appInnerElem.value.addEventListener('scroll', throttledScroll());
      }
      pollingInterval = executeAndSetInterval(() => {
        fetchTransactionList();
      }, 10000);
    });

    onUnmounted(() => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    });

    onIonViewWillEnter(() => {
      setScrollConf(false);
    });

    return {
      isOnline,
      transactions,
      transactionsLatest,
      transactionsMore,
      loading,
      loadMoreTransactions,
      innerScrollElem,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-transactions {
  --filter-top-offset: 175px;

  padding: 0 12px;
}
</style>
