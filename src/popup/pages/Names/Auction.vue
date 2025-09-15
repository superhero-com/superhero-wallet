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
        :animated="!IS_FIREFOX"
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
import { produceNameId } from '@aeternity/aepp-sdk';

import type { ChainName } from '@/types';

import { executeAndSetInterval } from '@/utils';
import { ROUTE_AUCTION_BID, ROUTE_AUCTION_HISTORY } from '@/popup/router/routeNames';
import { useUi } from '@/composables';
import { fadeAnimation } from '@/popup/animations';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { IS_FIREFOX } from '@/constants';

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

    const { getMiddleware } = useAeMiddleware();
    const { params: routeParams } = useRoute();
    const { isAppActive, isLoaderVisible, setLoaderVisible } = useUi();
    const { setAuctionEntry } = useAeNames();

    setLoaderVisible(true);

    async function updateAuctionEntry() {
      const middleware = await getMiddleware();
      try {
        const nameId = produceNameId(props.name);
        const [auctionInfo, accountActivities] = await Promise.all([
          middleware.getName(props.name),
          // TODO: show more than 100 bids
          middleware.getAccountActivities(nameId, { limit: 100 }),
        ]);

        // https://github.com/aeternity/ae_mdw/issues/509
        const { auctionEnd } = auctionInfo.auction ?? auctionInfo.info;

        const bids = accountActivities.data
          .filter(({ type }: any) => type === 'NameClaimEvent')
          .filter(({ payload: { sourceTxType } }: any) => sourceTxType === 'NameClaimTx')
          .map(({ payload: { tx: { accountId, nameFee } } }: any) => ({
            nameFee: new BigNumber(aettosToAe(nameFee)),
            accountId,
          }));

        setAuctionEntry({
          name: props.name,
          expiration: auctionEnd,
          bids,
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
      IS_FIREFOX,
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
@use '@/styles/variables' as *;

.auction {
  &-tabs {
    padding-inline: var(--screen-padding-x);
  }

  &-router {
    top: 8%;
  }
}
</style>
