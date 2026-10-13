<template>
  <PageWrapper
    :page-title="$t('pages.titles.auction')"
    has-sub-content
  >
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
  </PageWrapper>
</template>

<script lang="ts">
import { IonRouterOutlet } from '@ionic/vue';
import {
  defineComponent,
  onBeforeUnmount,
  watch,
  PropType,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { ChainName } from '@/types';

import { executeAndSetInterval } from '@/utils';
import { ROUTE_AUCTION_BID, ROUTE_AUCTION_HISTORY } from '@/popup/router/routeNames';
import { useUi } from '@/composables';
import { fadeAnimation } from '@/popup/animations';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { IS_FIREFOX } from '@/constants';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import Tabs from '@/popup/components/tabs/Tabs.vue';
import Tab from '@/popup/components/tabs/Tab.vue';

const POLLING_INTERVAL = 3000;

export default defineComponent({
  name: 'Auction',
  components: {
    PageWrapper,
    Tabs,
    Tab,
    IonRouterOutlet,
  },
  props: {
    name: { type: String as PropType<ChainName>, required: true },
  },
  setup(props) {
    const router = useRouter();

    const { params: routeParams } = useRoute();
    const { isAppActive, isLoaderVisible, setLoaderVisible } = useUi();
    const { setAuctionEntry, fetchNameAuction } = useAeNames();

    setLoaderVisible(true);

    async function updateAuctionEntry() {
      try {
        setAuctionEntry({
          name: props.name,
          ...await fetchNameAuction(props.name),
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
  // Fills the page so the router outlet can take the space below the tabs
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding-top: calc(#{$header-default-height} + env(safe-area-inset-top));

  &-tabs {
    padding-inline: var(--screen-padding-x);
  }

  &-router {
    position: relative;
    flex: 1;
  }
}
</style>
