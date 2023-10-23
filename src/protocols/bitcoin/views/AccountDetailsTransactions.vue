<template>
  <IonPage class="account-details-transactions">
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div ref="innerScrollElem">
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onUnmounted,
  ref,
  watch,
  PropType,
} from 'vue';
import { useStore } from 'vuex';
import { throttle } from 'lodash-es';
import { IonContent, IonPage } from '@ionic/vue';

import type { ITransaction, IonicLifecycleStatus } from '@/types';
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
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup(props) {
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

    function onViewDidLeaveHandler() {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setScrollConf(false);
    }

    watch(
      appInnerScrollTop,
      (value) => {
        setScrollConf(value >= FIXED_TABS_SCROLL_HEIGHT);
      },
    );

    watch(
      () => props.ionicLifecycleStatus,
      () => {
        if (props.ionicLifecycleStatus === 'willEnter') {
          // reset state since component might not have been unmounted
          loading.value = false;
          setScrollConf(false);

          if (innerScrollElem.value && appInnerElem.value) {
            appInnerElem.value.addEventListener('scroll', throttledScroll());
          }
          pollingInterval = executeAndSetInterval(() => {
            fetchTransactionList();
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
}
</style>
