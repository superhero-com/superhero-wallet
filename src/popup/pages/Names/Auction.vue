<template>
  <IonPage>
    <div class="auction">
      <div class="auction-tabs">
        <Tabs>
          <Tab
            :to="{ name: ROUTE_AUCTION_BID, params: routeParams }"
            :text="$t('pages.names.auctions.place-bid')"
            exact-path
          />
          <Tab
            :to="{ name: ROUTE_AUCTION_HISTORY, params: routeParams }"
            :text="$t('pages.names.auctions.bid-history')"
          />
        </Tabs>
      </div>

      <IonRouterOutlet
        v-if="!isLoaderVisible"
        :animation="fadeAnimation"
        class="auction-router"
        :name="name"
      />
    </div>
  </IonPage>
</template>

<script lang="ts">
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import {
  defineComponent,
  onBeforeUnmount,
  watch,
  PropType,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useRoute, useRouter } from 'vue-router';
import type { ChainName } from '@/types';

import { executeAndSetInterval } from '@/utils';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { ROUTE_AUCTION_BID, ROUTE_AUCTION_HISTORY } from '@/popup/router/routeNames';
import { useMiddleware, useUi } from '@/composables';
import { fadeAnimation } from '@/popup/animations';

import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';

const POLLING_INTERVAL = 3000;

export default defineComponent({
  name: 'Auction',
  components: {
    Tabs,
    Tab,
    IonRouterOutlet,
    IonPage,
  },
  props: {
    name: { type: String as PropType<ChainName>, required: true },
  },
  setup(props) {
    const router = useRouter();

    const { getMiddleware } = useMiddleware();
    const { params: routeParams } = useRoute();
    const { isAppActive, isLoaderVisible, setLoaderVisible } = useUi();
    const { setAuctionEntry } = useAeNames();

    setLoaderVisible(true);

    async function updateAuctionEntry() {
      const middleware = await getMiddleware();
      try {
        const res = await middleware.getName(props.name);
        const { auctionEnd, bids } = res.auction ?? res.info;
        const loadedBids = await Promise.all(bids.map(async (txId: number) => {
          const { tx } = await middleware.getTx(txId.toString());
          return {
            nameFee: new BigNumber(aettosToAe(tx.nameFee)),
            accountId: tx.accountId,
          };
        }));
        setAuctionEntry({
          name: props.name,
          expiration: auctionEnd,
          bids: loadedBids,
        });
      } catch (error) {
        router.push({ name: ROUTE_AUCTION_BID });
      }
      setLoaderVisible(false);
    }

    const intervalId = executeAndSetInterval(() => {
      if (isAppActive.value) {
        updateAuctionEntry();
      }
    }, POLLING_INTERVAL);

    onBeforeUnmount(() => {
      clearInterval(intervalId);
    });

    watch(
      () => props.name,
      () => updateAuctionEntry(),
    );

    return {
      ROUTE_AUCTION_BID,
      ROUTE_AUCTION_HISTORY,
      isLoaderVisible,
      routeParams,
      fadeAnimation,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.auction {
  &-tabs {
    padding-inline: var(--screen-padding-x);
  }

  &-router {
    top: 8%;
  }
}
</style>
