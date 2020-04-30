<template>
  <div class="popup">
    <div class="addNewName">
      <div class="maindiv_input-group-addon">
        <h4>{{ $t('pages.auctionBid.bidOn') }} {{ auctionInfo.info.name }}</h4>
        <hr />
        <hr />
        <!-- <ae-input v-model="auctionInfo.info.name" style="margin: 10px 0 10px 0; pointer-events: none;" label="Name" placeholder="..." error> -->
        <!-- </ae-input> -->
        <ae-input
          style="margin: 10px 0 10px 0;color:#000"
          label="Component"
          placeholder="0.0"
          v-model="amount"
          aemount
          error
        >
          <ae-text slot="header" fill="black">{{ $t('pages.appVUE.aeid') }}</ae-text>
          <ae-toolbar v-if="err.amount" slot="footer">
            {{ errtext.amount }}
          </ae-toolbar>
          <ae-toolbar v-else slot="footer">
            {{ $t('pages.auctionBid.requiredField') }}
          </ae-toolbar>
        </ae-input>
        <Button @click="nextStepBiddingHandler" class="danger">{{
          $t('pages.auctionBid.next')
        }}</Button>

        <div style="display:inline-block; margin:20px 0; width:100%;">
          <ae-text class="lefttext" align="left">
            {{ $t('pages.auctionBid.current-highest-bid') }}
          </ae-text>
          <ae-text class="righttext" align="right">
            {{ auctionInfo.info.winning_bid }} {{ $t('pages.appVUE.aeid') }}
          </ae-text>
        </div>
        <div>
          <ae-text class="lefttext" align="left">
            {{ $t('pages.auctionBid.remaining-time') }}
          </ae-text>
          <ae-text class="righttext" align="right">
            {{ expiration /* - topBlockHeight */ }}
          </ae-text>
        </div>
      </div>
    </div>
    <Loader size="big" :loading="loading" type="transparent" content=""></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { pick } from 'lodash-es';
import { MAGNITUDE } from '../../utils/constants';
import { convertToAE } from '../../utils/helper';

export default {
  data() {
    return {
      loading: false,
      expiration: 0,
      bids: null,
      highestBid: null,
      amount: '',
      MAGNITUDE,
      err: {
        amount: false,
      },
      errtext: {
        amount: '',
      },
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  props: ['auctionInfo'],
  computed: {
    ...mapGetters(['account', 'current', 'network', 'sdk']),
  },
  mounted() {
    this.loading = true;

    const id = setInterval(() => this.updateAuctionEntry(), 3000);
    this.$once('hook:destroyed', () => clearInterval(id));
    this.$watch(
      () => this.auctionInfo.info.name,
      () => this.updateAuctionEntry(),
      { immediate: true },
    );
    this.loading = false;
  },
  methods: {
    async updateAuctionEntry() {
      const res = await this.$store.dispatch('names/fetchAuctionEntry', this.auctionInfo.info.name);
      this.expiration = res.expiration;
      this.bids = res.bids;
      this.highestBid = res.bids
        .map(({ nameFee }) => nameFee)
        .reduce((a, b) => (a.isGreaterThan(b) ? a : b));
    },
    async nextStepBiddingHandler() {
      if (this.amount === '') {
        this.errtext.amount = 'Please add some amount';
        this.err.amount = true;
      } else if (this.amount <= this.highestBid.multipliedBy(1.05)) {
        this.errtext.amount = `This field must be more than ${this.highestBid
          .multipliedBy(1.05)
          .toString()}AE`;
        this.err.amount = true;
      } else {
        const { name } = this.auctionInfo.info;
        const amount = convertToAE(BigNumber(this.amount).shiftedBy(MAGNITUDE));
        const BigNumberAmount = BigNumber(this.amount).shiftedBy(MAGNITUDE);

        const tx = {
          popup: false,
          tx: {
            name,
            BigNumberAmount,
            amount,
          },
          type: 'nameBid',
          bid: true,
        };
        this.$store.commit('SET_AEPP_POPUP', true);
        this.$router.push({
          name: 'sign',
          params: {
            data: tx,
            type: tx.type,
          },
        });
      }
    },
    back() {
      this.$router.push('/aens');
    },
  },
};
</script>

<style lang="scss" scoped>
.lefttext {
  float: left;
  text-align: left;
  width: 50%;
  color: #888888;
}

.righttext {
  float: right;
  text-align: right;
  width: 50%;
  color: #888888;
}
</style>
