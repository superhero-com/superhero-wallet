<template>
  <div class="popup ">
    <div>
      <p class="primary-title text-left mb-8 f-16" v-if="!confirmMode">
        {{ $t('pages.tipPage.heading') }}
        <span class="secondary-text"> {{ $t('pages.appVUE.aeid') }} </span>
        {{ $t('pages.tipPage.to') }}
      </p>
      <p class="primary-title text-left mb-8 f-16" v-if="confirmMode">
        {{ $t('pages.tipPage.headingSending') }}
        <span class="secondary-text">{{ finalAmount }} {{ $t('pages.appVUE.aeid') }} </span>
        {{ $t('pages.tipPage.to') }}
        ({{ getCurrencyAmount }} {{ getCurrency }}) to
      </p>
      <a class="link-sm text-left block">{{ tipUrl }}</a>
      <AmountSend :amountError="amountError" @changeAmount="val => (finalAmount = val)" v-if="!confirmMode" :value="finalAmount" />
      <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" v-if="!confirmMode" />
      <div class="tip-note-preview mt-15" v-if="confirmMode">
        {{ note }}
      </div>
      <Button @click="toConfirm" :disabled="note && validAmount && !noteError && minCallFee ? false : true" v-if="!confirmMode">
        {{ $t('pages.tipPage.next') }}
      </Button>
      <Button @click="sendTip" v-if="confirmMode" :disabled="!tipping ? true : false">
        {{ $t('pages.tipPage.confirm') }}
      </Button>
      <Button @click="confirmMode = false" v-if="confirmMode">
        {{ $t('pages.tipPage.edit') }}
      </Button>
    </div>
    <TipBackground class="tip-bg" v-if="confirmMode" />
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    <Loader size="big" :loading="loading" type="transparent" content=""></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import BigNumber from 'bignumber.js';
import { MAGNITUDE, MIN_SPEND_TX_FEE, calculateFee, TX_TYPES } from '../../utils/constants';
import { setTxInQueue } from '../../utils/helper';
import TipBackground from '../../../icons/tip-bg.svg';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';

export default {
  components: {
    TipBackground,
    AmountSend,
    Textarea,
  },
  data() {
    return {
      tipUrl: false,
      finalAmount: null,
      note: null,
      domainDataInterval: null,
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      minCallFee: null,
      txParams: {},
    };
  },
  computed: {
    ...mapGetters(['balance', 'tokenSymbol', 'tokenBalance', 'popup', 'tipping', 'current', 'balanceCurrency', 'sdk', 'account', 'network']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.minCallFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    validAmount() {
      return this.finalAmount && !this.amountError;
    },
    getCurrency() {
      return this.current.currency.toUpperCase();
    },
    getCurrencyAmount() {
      return (this.finalAmount * this.current.currencyRate).toFixed(3);
    },
  },
  watch: {
    finalAmount() {
      this.amountError = false;
    },
  },
  created() {
    this.getDomainData();
    this.domainDataInterval = setInterval(() => this.getDomainData(), 5000);
  },
  methods: {
    getDomainData() {
      if (this.sdk !== null && !this.minCallFee) {
        this.txParams = {
          ...this.sdk.Ae.defaults,
          contractId: this.network[this.current.network].tipContract,
          callerId: this.account.publicKey,
        };
        try {
          const fee = calculateFee(TX_TYPES.contractCall, this.txParams);
          this.minCallFee = fee.min;
        } catch (e) {}
      }
      browser.tabs.query({ active: true, currentWindow: true }).then(async tabs => (this.tipUrl = tabs[0].url));
    },
    toConfirm() {
      if (!this.minCallFee || this.maxValue - this.finalAmount <= 0 || isNaN(this.finalAmount) || this.finalAmount <= 0) {
        return (this.amountError = true);
      }
      this.amountError = false;

      if (!this.note || !this.tipUrl) {
        return (this.noteError = true);
      }
      this.noteError = false;

      this.confirmMode = true;
    },
    sendTip() {
      const amount = BigNumber(this.finalAmount).shiftedBy(MAGNITUDE);
      return this.confirmTip(this.tipUrl, amount, this.note);
    },
    async confirmTip(domain, amount, note) {
      try {
        this.loading = true;
        const res = await this.tipping.call('tip', [domain, note], { amount, waitMined: false });
        if (res.hash) {
          browser.storage.local.set({ pendingTip: { hash: res.hash, amount: this.finalAmount, domain, time: new Date().toLocaleTimeString() } }).then(() => {});
          this.loading = false;
          this.$store.commit('SET_AEPP_POPUP', false);
          return this.$router.push({
            name: 'account',
          });
        }
      } catch (e) {
        console.log(e);
        this.loading = false;
        return this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      }
    },
    async tipWebsiteType() {
      if (this.tipDomain) {
        this.domain = extractHostName(this.url);
      } else {
        this.domain = this.url;
      }
    },
  },
  beforeDestroy() {
    clearInterval(this.domainDataInterval);
  },
};
</script>
<style lang="scss">
.tip-bg {
  position: fixed;
  left: 50%;
  top: 79%;
  transform: translateX(-50%);
  -webkit-transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  z-index: 0;
}
</style>
