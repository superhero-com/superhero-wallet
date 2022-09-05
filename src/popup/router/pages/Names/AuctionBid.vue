<template>
  <div class="auction-bid">
    <AuctionCard :name="name" />
    <div class="form">
      <InputAmount
        v-model="amount"
        :error="!!amountError"
        :message="amountError"
        @error="(val) => error = val"
      />
      <div class="tx-details">
        <DetailsItem :label="$t('tx-fee')">
          <TokenAmount
            slot="value"
            :amount="+txFee"
            hide-fiat
          />
        </DetailsItem>
        <DetailsItem :label="$t('total')">
          <TokenAmount
            slot="value"
            :amount="+amountTotal"
          />
        </DetailsItem>
      </div>
      <Button
        :disabled="!!amountError || error || !amount"
        @click="bid"
      >
        {{ $t('pages.names.auctions.place-bid') }}
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { aeToAettos, calculateNameClaimFee } from '../../../utils/helper';
import AuctionCard from '../../components/AuctionCard.vue';
import InputAmount from '../../components/InputAmount.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Button from '../../components/Button.vue';

export default {
  components: {
    AuctionCard, InputAmount, DetailsItem, TokenAmount, Button,
  },
  props: {
    name: { type: String, required: true },
  },
  data() {
    return {
      loading: false,
      amount: '',
      amountError: null,
      error: false,
    };
  },
  computed: {
    ...mapGetters('names', ['getHighestBid']),
    highestBid() {
      return this.getHighestBid(this.name).nameFee;
    },
    txFee() {
      return calculateNameClaimFee(this.name);
    },
    amountTotal() {
      return this.txFee.plus(this.amount || 0);
    },
  },
  watch: {
    amount(val) {
      if (+val <= this.highestBid.multipliedBy(1.05)) {
        const minBid = this.highestBid.multipliedBy(1.05).toString();
        this.amountError = this.$t('pages.names.auctions.min-bid', { minBid });
      } else {
        this.amountError = '';
      }
    },
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
        this.$router.push({ name: 'auction-history', params: { name: this.name } });
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
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.auction-bid {
  .form {
    padding: 16px;

    .tx-details {
      display: flex;
      padding-top: 16px;

      .details-item {
        margin-right: 24px;
      }
    }

    .button {
      margin-top: 16px;
    }
  }
}
</style>
