<template>
  <div class="popup">
    <Loader v-if="bids === null" />
    <p v-else-if="bids.length === 0">{{ $t('pages.names.auctions.not-found') }}</p>
    <template v-else>
      <div class="section-title">
        {{ $t('pages.names.auctions.expires') }}
        {{ (expiration - topBlockHeight) | blocksToRelativeTime }}
      </div>

      <div class="section-title">{{ $t('pages.names.auctions.current-bid') }}</div>

      <NameRow :address="currentBid.accountId">
        <div class="name">{{ currentBid.nameFee.toFixed(3) }} {{ $t('ae') }}</div>
        <span class="address">{{ currentBid.accountId }}</span>
      </NameRow>

      <template v-if="previousBids">
        <div class="section-title">{{ $t('pages.names.auctions.previous-bids') }}</div>
        <NameRow v-for="(bid, idx) in previousBids" :key="idx" :address="bid.accountId">
          <div class="name">{{ bid.nameFee.toFixed(3) }} {{ $t('ae') }}</div>
          <span class="address">{{ bid.accountId }}</span>
        </NameRow>
      </template>
    </template>
    <Button extend :to="{ name: 'auction-bid', params: { name } }">
      {{ $t('pages.names.auctions.bidding') }}
    </Button>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { blocksToRelativeTime } from '../../../../filters/toRelativeTime';
import NameRow from '../../components/NameRow';
import Button from '../../components/Button';

export default {
  components: { NameRow, Button },
  props: {
    name: { type: String, required: true },
  },
  data: () => ({
    expiration: 0,
    bids: null,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    currentBid() {
      if (!this.bids) return null;
      return this.bids.reduce((a, b) => (a.nameFee.isGreaterThan(b.nameFee) ? a : b));
    },
    previousBids() {
      if (!this.bids) return null;
      return this.bids.filter((bid) => bid !== this.currentBid);
    },
  },
  filters: { blocksToRelativeTime },
  async mounted() {
    const id = setInterval(() => this.updateAuctionEntry(), 3000);
    this.$once('hook:destroyed', () => clearInterval(id));
    this.$watch(
      ({ name }) => name,
      () => this.updateAuctionEntry(),
      { immediate: true },
    );
  },
  methods: {
    async updateAuctionEntry() {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      const { expiration, bids } = await this.$store.dispatch('names/fetchAuctionEntry', this.name);
      this.expiration = expiration;
      this.bids = bids;
    },
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
.section-title {
  text-align: left;
  margin-top: 15px;
  margin-bottom: 5px;
}
</style>
