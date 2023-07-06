<template>
  <ion-page>
    <div class="auction">
      <div class="auction-tabs">
        <Tabs>
          <Tab
            :to="{ name: 'auction-bid' }"
            :text="$t('pages.names.auctions.place-bid')"
            exact-path
          />
          <Tab
            :to="{ name: 'auction-history' }"
            :text="$t('pages.names.auctions.bid-history')"
          />
        </Tabs>
      </div>

      <Loader v-if="loading" />

      <IonRouterOutlet
        v-else
        class="auction-router"
      />
    </div>
  </ion-page>
</template>

<script lang="ts">
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import {
  defineComponent,
  ref,
  onBeforeUnmount,
  watch,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { aettosToAe, executeAndSetInterval } from '../../utils';
import { useMiddleware, useUi } from '../../../composables';

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

    const { getMiddleware } = useMiddleware({ store });
    const { isAppActive } = useUi();

    const loading = ref(true);

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
        store.commit('names/setAuctionEntry', {
          name: props.name,
          expiration: auctionEnd,
          bids: loadedBids,
        });
      } catch (error) {
        router.push({ name: 'auction-bid' });
      }
      loading.value = false;
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
      loading,
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
