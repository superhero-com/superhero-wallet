<template>
  <IonPage>
    <div class="auction">
      <div class="auction-tabs">
        <Tabs>
          <Tab
            :to="{ name: 'auction-bid', params: routeParams }"
            :text="$t('pages.names.auctions.place-bid')"
            exact-path
          />
          <Tab
            :to="{ name: 'auction-history', params: routeParams }"
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
} from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { produceNameId } from '@aeternity/aepp-sdk';

import { executeAndSetInterval } from '@/utils';
import { aettosToAe } from '@/protocols/aeternity/helpers';
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
    name: { type: String, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();

    const { getMiddleware } = useMiddleware();
    const { params: routeParams } = useRoute();
    const { isAppActive, isLoaderVisible, setLoaderVisible } = useUi();

    setLoaderVisible(true);

    async function updateAuctionEntry() {
      const middleware = await getMiddleware();
      try {
        const nameId = produceNameId(props.name as any);
        const [auctionInfo, accountActivities] = await Promise.all([
          middleware.getName(props.name),
          // TODO: show more than 100 bids
          middleware.getAccountActivities(nameId, { limit: 100 }),
        ]);

        const { auctionEnd } = auctionInfo.info;

        const bids = accountActivities.data
          .filter(({ type }: any) => type === 'NameClaimEvent')
          .filter(({ payload: { sourceTxType } }: any) => sourceTxType === 'NameClaimTx')
          .map(({ payload: { tx: { accountId, nameFee } } }: any) => ({
            nameFee: new BigNumber(aettosToAe(nameFee)),
            accountId,
          }));
        store.commit('names/setAuctionEntry', {
          name: props.name,
          expiration: auctionEnd,
          bids,
        });
      } catch (error) {
        router.push({ name: 'auction-bid' });
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
