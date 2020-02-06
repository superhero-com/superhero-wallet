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
            (0.30 USD) to
        </p>
        <a class="link-sm text-left block">{{ tipUrl }}</a>
        <div class="flex flex-justify-between flex-align-start mt-25" v-if="!confirmMode">
          <Input class="amount-box" type="number" :error="!amountError ? false : true" v-model="finalAmount" :placeholder="$t('pages.tipPage.amountPlaceholder')" :label="$t('pages.tipPage.amountLabel')"/>
          <div class="ml-15 text-left" style="margin-right:auto">
            <p class="label hidden">Empty</p>
            <span class="secondary-text f-14 block l-1"> {{ tokenSymbol }}</span>
            <span class="f-14 block l-1">60 USD</span>
          </div>
          <div class="balance-box">
            <p class="label">{{ $t('pages.tipPage.availableLabel') }}</p>
            <span class="secondary-text f-14 block l-1">{{ roundedAmount }} {{ tokenSymbol }}</span>
            <span class="f-14 block l-1">60 USD</span>
          </div>
        </div>

        <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" v-if="!confirmMode"/>
        <div class="tip-note-preview mt-15" v-if="confirmMode">
          {{ note }}
        </div>
        <Button @click="toConfirm" :disabled="note && validAmount && tipping && !noteError ? false: true" v-if="!confirmMode">
          {{ $t('pages.tipPage.next') }}
        </Button>
        <Button @click="sendTip"  v-if="confirmMode">
          {{ $t('pages.tipPage.confirm') }}
        </Button>
        <Button @click="confirmMode = false" v-if="confirmMode">
          {{ $t('pages.tipPage.edit') }}
        </Button>
      </div>
      <TipBackground class="tip-bg" v-if="confirmMode" />
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import BigNumber from 'bignumber.js';
import { MAGNITUDE, MIN_SPEND_TX_FEE } from '../../utils/constants';
import TipBackground from '../../../icons/tip-bg.svg'

export default {
  components: {
    TipBackground
  },
  data() {
    return {
      tipUrl: false,
      finalAmount: null,
      note: null,
      domainDataInterval: null,
      confirmMode: false,
      amountError:false,
      noteError:false
    };
  },
  computed: {
    ...mapGetters([
      'balance', 
      'tokenSymbol', 
      'tokenBalance', 
      'popup', 
      'tipping'
    ]),
    maxValue() {
      const calculatedMaxValue = this.balance - MIN_SPEND_TX_FEE;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    validAmount(){
      return this.finalAmount && !this.amountError
    },
    roundedAmount() {
      return this.tokenBalance.toFixed(3);
    }
  },
  watch: {
      finalAmount() {
        this.amountError = false
      }
  },
  created() {
    this.getDomainData();
    this.domainDataInterval = setInterval(() => this.getDomainData(), 5000);
  },
  methods: {
    getDomainData() {
      browser.tabs.query({ active: true, currentWindow: true }).then(async tabs => this.tipUrl = tabs[0].url );
    },
    toConfirm() {
      if (this.maxValue - this.finalAmount <= 0 || isNaN(this.finalAmount) || this.finalAmount <= 0) {
        return this.amountError = true
      } 
      this.amountError = false

      if (!this.note || !this.tipUrl) {
        return this.noteError = true
      }
      this.noteError = false

      this.confirmMode = true
    },
    sendTip() {
      const amount = BigNumber(this.finalAmount).shiftedBy(MAGNITUDE);
      return this.confirmTip(this.tipUrl, amount, this.note);
    },
    async confirmTip(domain, amount, note) {
      try {
        const res = await this.$helpers.contractCall({ instance: this.tippin, method:'tip', params: [domain,note, { amount, waitMined:false }] })
        if(res.hash) {
          this.$store.commit('SET_AEPP_POPUP', false);
          return this.$router.push({
            name: 'success-tip',
            params: {
              amount,
              domain,
            },
          });
        }
      } catch(e) {
        return this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
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
    z-index:0;
}
</style>