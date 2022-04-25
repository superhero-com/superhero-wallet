<template>
  <div class="auction-list">
    <Filters
      v-if="hasAuctions || loading"
      :value="displayMode"
      :filters="filters"
      @input="handleFilter"
    />
    <ul
      v-if="hasAuctions"
      class="list"
    >
      <NameRow
        v-for="({ name, expiration, lastBid }, key) in auctions"
        :key="key"
        :to="{ name: 'auction-bid', params: { name } }"
        :name="name"
        :address="lastBid && lastBid.accountId"
      >
        <div class="name-wrapper">
          <div class="name">
            {{ name }}
            <TokenAmount
              v-if="lastBid"
              :amount="getNameFee(lastBid)"
            />
          </div>
          <div class="expiration">
            {{ $t('pages.names.auctions.expires') }}
            in ≈{{ (expiration - topBlockHeight) | blocksToRelativeTime }}
          </div>
        </div>
      </NameRow>
    </ul>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
      :class="{ 'load-more': hasAuctions }"
    />
    <RegisterName
      v-else-if="!hasAuctions"
      :msg="$t('pages.names.auctions.no-auctions')"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { pick, throttle } from 'lodash-es';
import Filters from '../../components/Filters.vue';
import NameRow from '../../components/NameRow.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import AnimatedSpinner from '../../../../icons/animated-spinner.svg?skip-optimize';
import RegisterName from '../../components/RegisterName.vue';
import { blocksToRelativeTime } from '../../../../filters/toRelativeTime';

const filterMap = {
  soonest: 'expiration',
  // TODO - add other filters from middleware
};

export default {
  components: {
    Filters, NameRow, TokenAmount, AnimatedSpinner, RegisterName,
  },
  filters: { blocksToRelativeTime },
  data: () => ({
    displayMode: { sort: 'soonest', rotated: false },
    activeAuctions: [],
    nextPageUrl: null,
    filters: { soonest: { rotated: false }, bid: { rotated: false }, length: { rotated: false } },
    loading: true,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters(['getNameFee', 'activeNetwork']),
    hasAuctions() {
      return this.activeAuctions.length || this.auctions.length;
    },
    auctions() {
      // TODO - change to middleware sorting
      return [...this.activeAuctions].sort((a, b) => {
        switch (this.displayMode.sort) {
          case 'length':
            return a.name.length - b.name.length;
          case 'bid':
            return a.lastBid.nameFee - b.lastBid.nameFee;
          default:
            return 1;
        }
      });
    },
  },
  async mounted() {
    await this.$watchUntilTruly(() => this.$store.state.middleware);
    await this.fetchAuctionsChunk();
    this.setScrollWatcher();
    this.loading = false;
  },
  methods: {
    ...mapActions('names', ['fetchAuctions']),
    setScrollWatcher() {
      const app = document.querySelector('#app');
      const throttledLoadMore = () => throttle(this.checkLoadMore, 700);
      app.addEventListener('scroll', throttledLoadMore());
      this.$on('hook:destroyed', () => {
        app.removeEventListener('scroll', throttledLoadMore());
        this.isDestroyed = true;
      });
    },
    async checkLoadMore() {
      if (this.isDestroyed || !this.nextPageUrl) return;
      this.loading = true;
      const isDesktop = document.documentElement.clientWidth > 480 || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = isDesktop
        ? document.querySelector('#app') : document.documentElement;
      if (scrollHeight - scrollTop <= clientHeight + 300) {
        await this.fetchAuctionsChunk();
        this.loading = false;
      }
    },
    async fetchAuctionsChunk() {
      const filterBy = filterMap[this.displayMode.sort];
      const filterDirection = this.displayMode.rotated ? 'backward' : 'forward';
      const { data, next } = await this.fetchAuctions({
        next: this.nextPageUrl,
        filterBy,
        filterDirection,
      });
      this.activeAuctions = [...this.activeAuctions, ...data];
      this.nextPageUrl = next;
    },
    clearAuctionsList() {
      this.activeAuctions = [];
      this.nextPageUrl = null;
      document.querySelector('#app').scrollTop = 0;
    },
    async handleFilter(filterValue) {
      this.loading = true;
      this.displayMode = filterValue;
      this.clearAuctionsList();
      await this.fetchAuctionsChunk();
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';
@use '../../../../styles/mixins';

.auction-list {
  display: flex;
  flex-direction: column;

  .filters {
    top: unset;
    position: fixed;

    @include mixins.desktop {
      width: variables.$extension-width;
    }
  }

  .list {
    margin-top: 40px;
    padding: 0;

    .name-wrapper {
      display: flex;
      justify-content: space-between;

      @extend %face-sans-14-regular;

      line-height: 16px;

      .name {
        display: flex;
        flex-direction: column;
        font-weight: bold;
      }

      .expiration {
        align-self: flex-end;
        color: variables.$color-dark-grey;
      }
    }
  }

  .spinner {
    display: flex;
    width: 56px;
    height: 56px;
    margin: 72px auto 0 auto;

    &.load-more {
      margin-top: 0;
    }
  }
}
</style>
