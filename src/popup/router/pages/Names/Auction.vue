<template>
  <div class="auction">
    <Plate>
      <AccountSwitcher />
      <Tabs slot="bottom">
        <RouterLink
          :to="{ name: 'auction-bid' }"
          exact-path
        >
          <Auction /> {{ $t('pages.names.auctions.place-bid') }}
        </RouterLink>
        <RouterLink :to="{ name: 'auction-history' }">
          <History /> {{ $t('pages.names.auctions.bid-history') }}
        </RouterLink>
      </Tabs>
    </Plate>
    <Loader v-if="loading" />
    <RouterView v-else />
  </div>
</template>

<script>
import AccountSwitcher from '../../components/AccountSwitcher.vue';
import Plate from '../../components/Plate.vue';
import Tabs from '../../components/Tabs.vue';
import Auction from '../../../../icons/auction.svg?vue-component';
import History from '../../../../icons/history.svg?vue-component';

export default {
  components: {
    AccountSwitcher,
    Plate,
    Tabs,
    Auction,
    History,
  },
  props: {
    name: { type: String, required: true },
  },
  data: () => ({ loading: true }),
  mounted() {
    const id = setInterval(() => this.updateAuctionEntry(), 3000);
    this.$once('hook:destroyed', () => clearInterval(id));
    this.$watch(
      ({ name }) => name,
      () => {
        this.loading = true;
        this.updateAuctionEntry();
      },
      { immediate: true },
    );
  },
  methods: {
    async updateAuctionEntry() {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      try {
        const { expiration, bids } = await this.$store.dispatch('names/fetchAuctionEntry', this.name);
        this.$store.commit('names/setAuctionEntry', {
          name: this.name,
          expiration,
          bids,
        });
      } catch (error) {
        this.$router.push('/names/auctions');
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.auction {
  .tabs {
    margin-top: -10px;

    a {
      padding-top: 10px;
      height: 60px;
    }
  }
}
</style>
