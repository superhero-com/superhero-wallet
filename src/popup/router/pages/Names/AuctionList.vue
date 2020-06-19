<template>
  <div class="popup">
    <NameListHeader />

    <Button @click="filter = 'soonest'" :inactive="filter !== 'soonest'" third small>
      {{ $t('pages.names.auctions.soonest') }}
    </Button>
    <Button @click="filter = 'length'" :inactive="filter !== 'length'" third small>
      {{ $t('pages.names.auctions.length') }}
    </Button>
    <Button @click="filter = 'bid'" :inactive="filter !== 'bid'" third small>
      {{ $t('pages.names.auctions.bid') }}
    </Button>

    <ul v-if="activeAuctions.length" class="auctions-list">
      <NameRow
        v-for="({ name, expiration }, key) in auctions"
        :key="key"
        :to="{ name: 'auction-details', params: { name } }"
        :name="name"
      >
        <div class="name">{{ name }}</div>
        <div class="expiration">
          {{ $t('pages.names.auctions.expires') }}
          {{ (expiration - topBlockHeight) | blocksToRelativeTime }}
        </div>
      </NameRow>
    </ul>

    <p v-else>{{ $t('pages.names.auctions.no-auctions') }}</p>
  </div>
</template>

<script>
import NameListHeader from '../../components/NameListHeader';
import NameRow from '../../components/NameRow';
import blocksToRelativeTime from '../../../../filters/blocksToRelativeTime';

export default {
  components: { NameListHeader, NameRow },
  data: () => ({
    filter: 'soonest',
    activeAuctions: [],
    topBlockHeight: 0,
  }),
  computed: {
    auctions() {
      switch (this.filter) {
        case 'length':
          return this.activeAuctions.map(a => a).sort((a, b) => a.name.length - b.name.length);
        case 'bid':
          return this.activeAuctions.map(a => a).sort((a, b) => a.winning_bid - b.winning_bid);
        default:
          return this.activeAuctions;
      }
    },
  },
  filters: { blocksToRelativeTime },
  async created() {
    await this.$watchUntilTruly(() => this.$store.state.sdk);
    this.topBlockHeight = await this.$store.dispatch('getHeight');
    this.activeAuctions = await this.$store.dispatch('names/fetchAuctions');
  },
};
</script>

<style lang="scss" scoped>
.auctions-list {
  padding: 0;
  margin-top: 10px;
}
</style>
