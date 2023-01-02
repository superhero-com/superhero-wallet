<template>
  <div class="auction-list">
    <Filters
      v-if="activeAuctions.length || auctions.length || loading"
      v-model="displayMode"
      :filters="filters"
      sticky
    />
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
            <TokenAmount :amount="getNameFee(lastBid)" />
          </div>
          <div class="expiration">
            {{ $t('pages.names.auctions.expires') }}
            in ≈{{ blocksToRelativeTime(expiration - topBlockHeight) }}
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
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from '@vue/composition-api';
import { watchUntilTruthy, blocksToRelativeTime, rxJsObservableToVueState } from '../../utils';
import { useGetter } from '../../../composables';
import { IActiveAuction, ObjectValues } from '../../../types';

import Filters, { IFilters, IFilterInputPayload } from '../../components/Filters.vue';
import NameRow from '../../components/NameRow.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import RegisterName from '../../components/RegisterName.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';

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
  },
  setup(props, { root }) {
    const loading = ref(false);
    const activeAuctions = ref<IActiveAuction[]>([]);
    const displayMode = ref<AuctionsFilterPayload>({ key: 'soonest', rotated: false });
    const filters = ref<AuctionsFilters>({
      soonest: { rotated: false, name: root.$t('filters.soonest') },
      bid: { rotated: false, name: root.$t('filters.bid') },
      length: { rotated: false, name: root.$t('filters.length') },
    });

    const getNameFee = useGetter('getNameFee');

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

    const topBlockHeight = rxJsObservableToVueState<number>(
      (root.$store.state as any).observables.topBlockHeight,
    );

    onMounted(async () => {
      loading.value = true;
      await watchUntilTruthy(() => root.$store.state.middleware);
      activeAuctions.value = await root.$store.dispatch('names/fetchAuctions');
      loading.value = false;
    });

    return {
      loading,
      displayMode,
      activeAuctions,
      auctions,
      filters,
      topBlockHeight,
      getNameFee,
    };
  },
  methods: {
    blocksToRelativeTime,
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.auction-list {
  --filter-top-offset: 166px;

  display: flex;
  flex-direction: column;

  .list {
    padding: 0;

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

  ::v-deep .filters {
    position: sticky;
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }
}
</style>
