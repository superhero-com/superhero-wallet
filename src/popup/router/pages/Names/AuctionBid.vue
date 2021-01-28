<template>
  <div class="popup">
    <h4>{{ $t('pages.names.auctions.bid-on') }} {{ name }}</h4>
    <AmountSend :amountError="!+amount" v-model="amount" :errorMsg="amountError" />
    <Button extend @click="bid" :disabled="!!amountError || !+amount">
      {{ $t('pages.names.auctions.bid') }}
    </Button>

    <div class="details-row">
      <span>
        {{ $t('pages.names.auctions.current-heighest-bid') }}
      </span>
      <span> {{ highestBid }} {{ $t('ae') }} </span>
    </div>
    <div class="details-row">
      <span>
        {{ $t('pages.names.auctions.remaining-time') }}
      </span>
      <span>
        {{ (expiration - topBlockHeight) | blocksToRelativeTime }}
      </span>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { blocksToRelativeTime } from '../../../../filters/toRelativeTime';
import Button from '../../components/Button';
import AmountSend from '../../components/AmountSend';
import { aeToAettos } from '../../../utils/helper';

export default {
  components: { Button, AmountSend },
  data() {
    return {
      loading: false,
      expiration: 0,
      highestBid: null,
      amount: 0,
      amountError: null,
    };
  },
  props: {
    name: { type: String, required: true },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  watch: {
    amount(val) {
      if (!+val) {
        this.amountError = this.$t('pages.names.auctions.add-amount');
      } else if (+val <= this.highestBid.multipliedBy(1.05)) {
        const minBid = this.highestBid.multipliedBy(1.05).toString();
        this.amountError = this.$t('pages.names.auctions.min-bid', { minBid });
      } else {
        this.amountError = false;
      }
    },
  },
  filters: { blocksToRelativeTime },
  async created() {
    this.loading = true;
    await this.$watchUntilTruly(() => this.$store.state.middleware);
    const res = await this.$store.dispatch('names/fetchAuctionEntry', this.name);
    this.expiration = res.expiration;
    this.highestBid = res.bids
      .map(({ nameFee }) => nameFee)
      .reduce((a, b) => (a.isGreaterThan(b) ? a : b));
    this.loading = false;
  },
  methods: {
    async bid() {
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      if (this.amountError) return;
      this.loading = true;
      try {
        await this.$store.state.sdk.aensBid(this.name, aeToAettos(this.amount));
        this.$store.dispatch('modals/open', {
          name: 'default',
          msg: this.$t('pages.names.auctions.bid-added', { name: this.name }),
        });
        this.$router.push({ name: 'auction-details', params: { name: this.name } });
      } catch (e) {
        let msg = e.message;
        if (msg.includes('is not enough to execute')) {
          msg = this.$t('pages.names.balance-error');
        }
        this.$store.dispatch('modals/open', { name: 'default', msg });
      } finally {
        this.loading = false;
      }
    },
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
.details-row {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}
</style>
