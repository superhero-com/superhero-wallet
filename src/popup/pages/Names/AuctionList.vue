<template>
  <IonPage class="auction-list">
    <IonToolbar class="toolbar">
      <Filters
        v-if="activeAuctions.length || auctions.length || loading"
        v-model="displayMode"
        :filters="filters"
        sticky
      />
    </IonToolbar>

    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="auction-list-content">
        <div
          v-if="activeAuctions.length || auctions.length"
          class="list"
        >
          <NameAuctionListItem
            v-for="(auction, key) in auctions"
            :key="key"
            :to="{ name: 'auction-bid', params: { name: auction.name } }"
            :auction="auction"
            :top-block-height="topBlockHeight"
          />
        </div>
        <AnimatedSpinner
          v-else-if="loading"
          class="spinner"
        />
        <RegisterName
          v-else
          :msg="$t('pages.names.auctions.no-auctions')"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent, IonToolbar } from '@ionic/vue';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  IFilters,
  IFilterInputPayload,
  INameAuction,
  ObjectValues,
} from '@/types';
import { fetchAllPages } from '@/utils';
import { useTopHeaderData } from '@/composables';
import { getAeFee } from '@/protocols/aeternity/helpers';
import { useAeMiddleware } from '@/protocols/aeternity/composables';

import Filters from '@/popup/components/Filters.vue';
import NameAuctionListItem from '@/popup/components/NameAuctionListItem.vue';
import RegisterName from '@/popup/components/RegisterName.vue';
import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';

const SORT_MODE = {
  soonest: 'soonest',
  bid: 'bid',
  length: 'length',
} as const;

type AuctionsSortMode = ObjectValues<typeof SORT_MODE>;
type AuctionsFilters = IFilters<AuctionsSortMode>;
type AuctionsFilterPayload = IFilterInputPayload<AuctionsSortMode>;

const SORT_ASC = 1;
const SORT_DESC = -1;

export default defineComponent({
  components: {
    Filters,
    NameAuctionListItem,
    AnimatedSpinner,
    RegisterName,
    IonPage,
    IonContent,
    IonToolbar,
  },
  setup() {
    const { t } = useI18n();

    const { topBlockHeight } = useTopHeaderData();
    const { fetchFromMiddlewareCamelCased } = useAeMiddleware();

    const loading = ref(false);
    const activeAuctions = ref<INameAuction[]>([]);
    const displayMode = ref<AuctionsFilterPayload>({ key: 'soonest', rotated: false });
    const filters = ref<AuctionsFilters>({
      soonest: { rotated: false, name: t('filters.soonest') },
      bid: { rotated: false, name: t('filters.bid') },
      length: { rotated: false, name: t('filters.length') },
    });

    const auctions = computed(
      () => [...activeAuctions.value]
        .sort((a, b) => {
          switch (displayMode.value.key) {
            case SORT_MODE.length:
              return a.name.length - b.name.length;
            case SORT_MODE.bid:
              return parseInt(a.lastBid.nameFee, 10) - parseInt(b.lastBid.nameFee, 10);
            default:
              return 1;
          }
        })
        .sort(() => (displayMode.value.rotated ? SORT_DESC : SORT_ASC)),
    );

    onMounted(async () => {
      loading.value = true;

      // TODO: Switch to onscroll loading after/while resolving https://github.com/aeternity/ae_mdw/issues/666
      activeAuctions.value = (
        await fetchAllPages(
          () => fetchFromMiddlewareCamelCased('/v3/names/auctions?limit=100&direction=forward'),
          fetchFromMiddlewareCamelCased,
        )
      ).map(({ name, lastBid, auctionEnd }) => ({
        name,
        expiration: auctionEnd,
        lastBid: lastBid.tx,
      }));

      loading.value = false;
    });

    return {
      loading,
      displayMode,
      activeAuctions,
      auctions,
      filters,
      topBlockHeight,
      getAeFee,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.auction-list {
  .toolbar {
    --background: var(--screen-bg-color); // Ionic related variable
    --min-height: 0;

    padding-inline: var(--screen-padding-x);
  }

  .auction-list-content {
    --filter-top-offset: 166px;

    display: flex;
    flex-direction: column;

    .list {
      padding-inline: var(--screen-padding-x);
      margin-inline: calc(-1 * var(--screen-padding-x));
    }

    .spinner {
      display: flex;
      width: 56px;
      height: 56px;
      margin: 72px auto 0 auto;
    }

    :deep(.filters) {
      position: sticky;
      top: env(safe-area-inset-top);
      margin-left: 0;
      margin-right: 0;
    }
  }
}
</style>
