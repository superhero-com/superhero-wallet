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
        <ul
          v-if="activeAuctions.length || auctions.length"
          class="list"
        >
          <NameRow
            v-for="({ name, expiration, lastBid }, key) in auctions"
            :key="key"
            :to="{ name: 'auction-bid', params: { name } }"
            :name="name"
            :address="lastBid.accountId"
          >
            <div class="name-wrapper">
              <div class="name">
                {{ name }}
                <TokenAmount
                  :amount="getAeFee(lastBid.nameFee)"
                  :protocol="PROTOCOL_AETERNITY"
                />
              </div>
              <div
                v-if="topBlockHeight"
                class="expiration"
              >
                {{ $t('pages.names.auctions.expires') }}
                in ≈ {{ blocksToRelativeTime(expiration - topBlockHeight) }}
              </div>
            </div>
          </NameRow>
        </ul>
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
  IActiveAuction,
  ObjectValues,
  IFilters,
  IFilterInputPayload,
} from '@/types';
import {
  blocksToRelativeTime,
  fetchAllPages,
} from '@/utils';
import {
  useMiddleware,
  useTopHeaderData,
} from '@/composables';
import { getAeFee } from '@/protocols/aeternity/helpers';
import { PROTOCOL_AETERNITY } from '@/constants';

import Filters from '@/popup/components/Filters.vue';
import NameRow from '@/popup/components/NameRow.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import RegisterName from '@/popup/components/RegisterName.vue';
import AnimatedSpinner from '@/icons/animated-spinner.svg?skip-optimize';

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
    NameRow,
    TokenAmount,
    AnimatedSpinner,
    RegisterName,
    IonPage,
    IonContent,
    IonToolbar,
  },
  setup() {
    const { t } = useI18n();

    const { topBlockHeight } = useTopHeaderData();
    const { getMiddleware, fetchFromMiddlewareCamelCased } = useMiddleware();

    const loading = ref(false);
    const activeAuctions = ref<IActiveAuction[]>([]);
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

      const middleware = await getMiddleware();

      // TODO: Switch to onscroll loading after/while resolving https://github.com/aeternity/ae_mdw/issues/666
      activeAuctions.value = (
        await fetchAllPages(
          () => middleware.getNamesAuctions({ by: 'expiration', direction: 'forward', limit: 100 }),
          fetchFromMiddlewareCamelCased,
        )
      ).map(({ name, info }) => ({
        name,
        expiration: info.auctionEnd,
        lastBid: info.lastBid.tx,
      }));

      loading.value = false;
    });

    return {
      PROTOCOL_AETERNITY,
      blocksToRelativeTime,
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
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.auction-list {
  .toolbar {
    --background: var(--screen-bg-color);
    --min-height: 0;

    padding-inline: var(--screen-padding-x);
  }

  .auction-list-content {
    --filter-top-offset: 166px;

    display: flex;
    flex-direction: column;

    .list {
      padding: 0 12px;
      margin-inline: calc(-1 * var(--screen-padding-x));

      .name-wrapper {
        @extend %face-sans-14-regular;

        display: flex;
        justify-content: space-between;
        line-height: 16px;

        .name {
          display: flex;
          flex-direction: column;
          font-weight: bold;
        }

        .expiration {
          align-self: flex-end;
          user-select: none;
          color: variables.$color-grey-dark;
        }
      }
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
