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
        ({{ getCurrencyAmount }} {{ currentCurrency }}) to
      </p>
      <div class="flex flex-align-center flex-justify-between">
        <a class="link-sm text-left block" style="width:90%;">  {{ tipUrl }} </a>
        <CheckIcon v-if="urlVerified" />
      </div>
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
import { MAGNITUDE, MIN_SPEND_TX_FEE, calculateFee, TX_TYPES, TIP_SERVICE } from '../../utils/constants';
import { setPendingTx, escapeSpecialChars } from '../../utils/helper';
import TipBackground from '../../../icons/tip-bg.svg';
import CheckIcon from '../../../icons/check-icon.svg';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import axios from 'axios';

export default {
  components: {
    TipBackground,
    AmountSend,
    Textarea,
    CheckIcon
  },
  data() {
    return {
      tipUrl: false,
      finalAmount: null,
      note: null,
      feeInterval: null,
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      minCallFee: null,
      txParams: {},
      urlVerified: false
    };
  },
  computed: {
    ...mapGetters(['balance', 'tokenSymbol', 'tokenBalance', 'popup', 'tipping', 'current', 'balanceCurrency', 'sdk', 'account', 'network', 'currentCurrency']),
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
    this.feeInterval = setInterval(() => { 
      if(!this.minCallFee) {
        this.getCallFee() 
        clearInterval(this.feeInterval)
      }
    }, 5000);
  },
  methods: {
    async getDomainData() {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if(tabs.length) {
        this.tipUrl =  tabs[0].url
        this.checkUrlVerified();
      }
      
    },
    getCallFee() {
      if (this.sdk !== null && !this.minCallFee) {
        this.txParams = {
          ...this.sdk.Ae.defaults,
          contractId: this.network[this.current.network].tipContract,
          callerId: this.account.publicKey,
        };
        try {
          const fee = calculateFee(TX_TYPES.contractCall, this.txParams);
          this.minCallFee = fee.min;
        } catch (e) { console.log(e) }
      }
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
        const pendings = [];
        this.loading = true;
        const res = await this.tipping.call('tip', [domain, escapeSpecialChars(note)], { amount, waitMined: false });
        if (res.hash) {
          await setPendingTx({ hash: res.hash, amount: this.finalAmount, domain, time: new Date().toLocaleTimeString(), type: 'tip' });
          this.loading = false;
          this.$store.commit('SET_AEPP_POPUP', false);
          return this.$router.push('/account');
        }
      } catch (e) {
        this.loading = false;
        return this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      }
    },
    async checkUrlVerified() {
      try {
        const res = (await axios.get(`${TIP_SERVICE}/verified`)).json()
        if(res.includes(this.tipUrl)) {
          this.$store.dispatch('popupAlert', { name: 'account', type: 'tip_url_verified' });
          this.urlVerified = true
        }
      } catch(e) {
        console.log(e)
      } 
    }
  },
  beforeDestroy() {
    clearInterval(this.feeInterval);
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
