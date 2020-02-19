<template>
  <div class="popup">
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
        <div v-if="!editUrl" class="flex flex-align-center flex-justify-between" style="width: 100%;">
          <a class="link-sm text-left block" style="width:90%;"> {{ editedUrl ? editedUrl : tipUrl }} </a> <CheckIcon v-if="urlVerified" />
        </div>
        <button v-if="!editUrl && !confirmMode" @click="handleUrlEdit"><ae-icon name="vote" /></button>

        <Input style="width:100%;" size="m-0 xsm" v-if="editUrl && !confirmMode" type="text" v-model="editedUrl" :value="tipUrl" />
        <button v-if="editUrl && !confirmMode" @click="editUrl = false"><ae-icon name="check" /></button>
      </div>

      <AmountSend :amountError="amountError" @changeAmount="val => (finalAmount = val)" v-if="!confirmMode" :value="finalAmount" />
      <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" v-if="!confirmMode" />
      <div class="tip-note-preview mt-15" v-if="confirmMode">
        {{ note }}
      </div>
      <Button @click="toConfirm" :disabled="!note || !validAmount || noteError || !minCallFee || editUrl" v-if="!confirmMode">
        {{ $t('pages.tipPage.next') }}
      </Button>
      <Button @click="sendTip" v-if="confirmMode" :disabled="!tipping">
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
import { setInterval, clearInterval } from 'timers';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import { MAGNITUDE, calculateFee, TX_TYPES, TIP_SERVICE } from '../../utils/constants';
import { setPendingTx, escapeSpecialChars } from '../../utils/helper';
import TipBackground from '../../../icons/tip-bg.svg';
import CheckIcon from '../../../icons/check-icon.svg';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import Input from '../components/Input';

export default {
  components: {
    TipBackground,
    AmountSend,
    Textarea,
    CheckIcon,
    Input,
  },
  data() {
    return {
      tipUrlCurrentTab: false,
      finalAmount: null,
      note: null,
      feeInterval: null,
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      minCallFee: null,
      txParams: {},
      urlVerified: false,
      editUrl: false,
      editedUrl: '',
    };
  },
  computed: {
    ...mapGetters(['balance', 'tokenBalance', 'popup', 'tipping', 'current', 'balanceCurrency', 'sdk', 'account', 'network', 'currentCurrency']),
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
    tipUrl() {
      const urlParam = new URL(this.$route.fullPath, window.location).searchParams.get('url');
      const path = urlParam && decodeURIComponent(urlParam);
      if (!path) return this.tipUrlCurrentTab;
      const url = new URL(/^\w+:\D+/.test(path) ? path : `https://${path}`);
      return url.toString();
    },
  },
  watch: {
    finalAmount() {
      this.amountError = false;
    },
    editedtipUrl(val) {
      this.$emit('changeAmount', val);
    },
  },
  created() {
    this.getDomainData();
    this.feeInterval = setInterval(() => this.getCallFee(), 1000);
    this.$once('hook:beforeDestroy', () => clearInterval(this.feeInterval));
  },
  methods: {
    editUrlfunc() {
      this.editUrl = false;
    },
    handleUrlEdit() {
      this.editUrl = true;
      this.editedUrl = this.tipUrl;
    },
    async getDomainData() {
      if (process.env.IS_EXTENSION) {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          this.tipUrlCurrentTab = tab.url;
          this.checkUrlVerified();
        }
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
          clearInterval(this.feeInterval);
        } catch (e) {
          this.minCallFee = null;
        }
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
      return this.confirmTip(this.editedUrl ? this.editedUrl : this.tipUrl, amount, this.note);
    },
    async confirmTip(domain, amount, note) {
      try {
        const pendings = [];
        this.loading = true;
        const res = await this.tipping.call('tip', [domain, escapeSpecialChars(note)], { amount, waitMined: false });
        if (res.hash) {
          await setPendingTx({ hash: res.hash, amount: this.finalAmount, domain, time: Date.parse(new Date()), type: 'tip' });
          this.loading = false;
          return this.$router.push('/account');
        }
      } catch (e) {
        this.loading = false;
        return this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      }
    },
    async checkUrlVerified() {
      try {
        const res = (await axios.get(`${TIP_SERVICE}/verified`)).json();
        if (res.includes(this.tipUrl)) {
          this.$store.dispatch('popupAlert', { name: 'account', type: 'tip_url_verified' });
          this.urlVerified = true;
        }
      } catch (e) {}
    },
  },
};
</script>

<style lang="scss" scoped>
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
