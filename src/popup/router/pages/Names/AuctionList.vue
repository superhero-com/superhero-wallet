<template>
  <div class="auction-list">
    <NameListHeader />

    <Button
      :inactive="filter !== 'soonest'"
      third
      small
      @click="filter = 'soonest'"
    >
      {{ $t('pages.names.auctions.soonest') }}
    </Button>
    <Button
      :inactive="filter !== 'length'"
      third
      small
      @click="filter = 'length'"
    >
      {{ $t('pages.names.auctions.length') }}
    </Button>
    <Button
      :inactive="filter !== 'bid'"
      third
      small
      @click="filter = 'bid'"
    >
      {{ $t('pages.names.auctions.bid') }}
    </Button>

    <ul
      v-if="activeAuctions.length"
      class="list"
    >
      <NameRow
        v-for="({ name, expiration, lastBid }, key) in auctions"
        :key="key"
        :to="{ name: 'auction-bid', params: { name } }"
        :name="name"
        :address="lastBid.accountId"
      >
        <div class="name">
          {{ name }}
        </div>
        <div class="expiration">
          {{ $t('pages.names.auctions.expires') }}
          in ~ {{ (expiration - topBlockHeight) | blocksToRelativeTime }}
        </div>
      </NameRow>
    </ul>

    <p v-else>
      {{ $t('pages.names.auctions.no-auctions') }}
    </p>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import NameListHeader from '../../components/NameListHeader';
import Button from '../../components/Button';
import NameRow from '../../components/NameRow';
import { blocksToRelativeTime } from '../../../../filters/toRelativeTime';

export default {
  components: { NameListHeader, Button, NameRow },
  filters: { blocksToRelativeTime },
  data: () => ({
    filter: 'soonest',
    activeAuctions: [],
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    auctions() {
      switch (this.filter) {
        case 'length':
          return [...this.activeAuctions].sort((a, b) => a.name.length - b.name.length);
        case 'bid':
          return [...this.activeAuctions].sort((a, b) => a.lastBid.nameFee - b.lastBid.nameFee);
        default:
          return this.activeAuctions;
      }
    },
  },
  async mounted() {
    await this.$watchUntilTruly(() => this.$store.state.middleware);
    this.activeAuctions = await this.$store.dispatch('names/fetchAuctions');
  },
};
</script>

<style lang="scss" scoped>
.auction-list .list {
  padding: 0;
  margin-top: 10px;
}
</style>
