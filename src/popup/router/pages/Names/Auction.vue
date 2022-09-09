<template>
  <div class="auction">
    <Tabs>
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

    <Loader v-if="loading" />

    <RouterView v-else />
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { aettosToAe } from '../../../utils/helper';
import Tabs from '../../components/Tabs.vue';
import Auction from '../../../../icons/auction.svg?vue-component';
import History from '../../../../icons/history.svg?vue-component';

export default {
  name: 'Auctions',
  components: {
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
        const res = await this.$store.state.middleware.getNameById(this.name);
        // TODO: remove after resolving https://github.com/aeternity/ae_mdw/issues/509
        const { auctionEnd, bids } = res.auction ?? res.info;
        const loadedBids = await Promise.all(bids.map(async (txId) => {
          const { tx } = await this.$store.state.middleware.getTxByIndex(txId);
          return {
            nameFee: new BigNumber(aettosToAe(tx.nameFee)),
            accountId: tx.accountId,
          };
        }));
        this.$store.commit('names/setAuctionEntry', {
          name: this.name,
          expiration: auctionEnd,
          bids: loadedBids,
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
