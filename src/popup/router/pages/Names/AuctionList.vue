<template>
  <div class="auction-list">
    <Filters
      v-if="activeAuctions.length || auctions.length || loading"
      v-model="displayMode"
      :filters="filters"
      :fixed="filtersFixed"
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
            in ≈{{ (expiration - topBlockHeight) | blocksToRelativeTime }}
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

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import Filters from '../../components/Filters.vue';
import NameRow from '../../components/NameRow.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import AnimatedSpinner from '../../../../icons/animated-spinner.svg?skip-optimize';
import RegisterName from '../../components/RegisterName.vue';
import { blocksToRelativeTime } from '../../../../filters/toRelativeTime';

export default {
  components: {
    Filters,
    NameRow,
    TokenAmount,
    AnimatedSpinner,
    RegisterName,
  },
  filters: {
    blocksToRelativeTime,
  },
  props: {
    filtersFixed: Boolean,
  },
  data: () => ({
    displayMode: { sort: 'soonest', rotated: false },
    activeAuctions: [],
    filters: { soonest: { rotated: false }, bid: { rotated: false }, length: { rotated: false } },
    loading: false,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters(['getNameFee']),
    auctions() {
      return [...this.activeAuctions].sort((a, b) => {
        switch (this.displayMode.sort) {
          case 'length':
            return a.name.length - b.name.length;
          case 'bid':
            return a.lastBid.nameFee - b.lastBid.nameFee;
          default:
            return 1;
        }
      }).sort(() => (this.displayMode.rotated ? -1 : 1));
    },
  },
  async mounted() {
    this.loading = true;
    await this.$watchUntilTruly(() => this.$store.state.middleware);
    this.activeAuctions = await this.$store.dispatch('names/fetchAuctions');
    this.loading = false;
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
  }
}
</style>
