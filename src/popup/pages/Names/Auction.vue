<template>
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

    <RouterView v-else />
  </div>
</template>

<script lang="ts">
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
import { useMiddleware } from '../../../composables';

import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';

export default defineComponent({
  name: 'Auction',
  components: {
    Tabs,
    Tab,
  },
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();

    const { getMiddleware } = useMiddleware({ store });

    const loading = ref(true);

    async function updateAuctionEntry() {
      const middleware = await getMiddleware();
      try {
        const res = await middleware.getNameById(props.name);
        const { auctionEnd, bids } = res.info;
        const loadedBids = await Promise.all(bids.map(async (txId: number) => {
          const { tx } = await middleware.getTxByIndex(txId);
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

    const intervalId = executeAndSetInterval(() => updateAuctionEntry(), 3000);

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
}
</style>
