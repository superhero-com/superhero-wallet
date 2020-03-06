<template>
  <div class="popup">
    <p class="primary-title text-left mb-8 f-16">
      <template v-if="!confirmMode">
        {{ $t('pages.tipPage.heading') }}
        <span class="secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
        {{ $t('pages.tipPage.to') }}
      </template>
      <template v-else>
        {{ $t('pages.tipPage.headingSending') }}
        <span class="secondary-text">{{ amount }} {{ $t('pages.appVUE.aeid') }}</span>
        ({{ currencyAmount }} {{ currentCurrency }}) {{ $t('pages.tipPage.to') }}
      </template>
    </p>

    <div class="url-bar">
      <template v-if="!editUrl">
        <a class="link-sm text-left">{{ url }}</a>
        <CheckIcon v-if="urlVerified" />
      </template>
      <Input v-else size="m-0 xsm" v-model="url" />
      <button v-if="!confirmMode" @click="editUrl = !editUrl">
        <ae-icon :name="editUrl ? 'check' : 'vote'" />
      </button>
    </div>

    <template v-if="!confirmMode">
      <AmountSend :amountError="amountError" @changeAmount="val => (amount = val)" :value="amount" />
      <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" />
      <Button @click="toConfirm" :disabled="!note || amountError || noteError || !minCallFee || editUrl">
        {{ $t('pages.tipPage.next') }}
      </Button>
    </template>
    <template v-else>
      <div class="tip-note-preview mt-15">
        {{ note }}
      </div>
      <Button @click="sendTip" :disabled="!tipping">
        {{ $t('pages.tipPage.confirm') }}
      </Button>
      <Button @click="confirmMode = false">
        {{ $t('pages.tipPage.edit') }}
      </Button>
    </template>

    <popup :popupSecondBtnClick="popup.secondBtnClick" />
    <Loader size="big" :loading="loading" type="transparent" content="" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import { MAGNITUDE, calculateFee, TX_TYPES, BACKEND_URL } from '../../utils/constants';
import { setPendingTx, escapeSpecialChars } from '../../utils/helper';
import CheckIcon from '../../../icons/check-icon.svg';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import Input from '../components/Input';

export default {
  components: {
    AmountSend,
    Textarea,
    CheckIcon,
    Input,
  },
  data() {
    return {
      url: '',
      amount: null,
      note: null,
      confirmMode: false,
      amountError: false,
      noteError: false,
      loading: false,
      minCallFee: null,
      editUrl: false,
      verifiedUrls: [],
    };
  },
  computed: {
    ...mapGetters(['balance', 'popup', 'tipping', 'current', 'sdk', 'account', 'network', 'currentCurrency']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.minCallFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    currencyAmount() {
      return (this.amount * this.current.currencyRate).toFixed(3);
    },
    urlVerified() {
      return this.url && this.verifiedUrls.includes(new URL(this.url).hostname);
    },
  },
  watch: {
    amount() {
      this.amountError = false;
    },
    urlVerified(val) {
      if (val) this.$store.dispatch('popupAlert', { name: 'account', type: 'tip_url_verified' });
    },
    $route: {
      immediate: true,
      handler({ fullPath }) {
        const urlParam = new URL(fullPath, window.location).searchParams.get('url');
        const path = urlParam && decodeURIComponent(urlParam);
        if (!path) return;
        const url = new URL(/^\w+:\D+/.test(path) ? path : `https://${path}`);
        this.url = url.toString();
      },
    },
  },
  async created() {
    if (process.env.IS_EXTENSION) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.url = tab.url;
      }
    }

    this.verifiedUrls = (await axios.get(`${BACKEND_URL}/verified`)).data;

    await new Promise(resolve => {
      const id = setInterval(() => {
        if (!this.sdk) return;
        clearInterval(id);
        resolve();
      }, 1000);
    });
    this.minCallFee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.network[this.current.network].tipContract,
      callerId: this.account.publicKey,
    }).min;
  },
  methods: {
    toConfirm() {
      this.amountError = !this.amount || !this.minCallFee || this.maxValue - this.amount <= 0;
      this.amountError = this.amountError || Number.isNaN(this.amount) || this.amount <= 0;
      this.noteError = !this.note || !this.url;
      this.confirmMode = !this.amountError && !this.noteError;
    },
    async sendTip() {
      const amount = BigNumber(this.amount).shiftedBy(MAGNITUDE);
      this.loading = true;
      try {
        const res = await this.tipping.call('tip', [this.url, escapeSpecialChars(this.note)], { amount, waitMined: false });
        if (res.hash) {
          await setPendingTx({ hash: res.hash, amount: this.amount, domain: this.url, time: Date.now(), type: 'tip' });
          this.$router.push('/account');
        }
      } catch (e) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.url-bar {
  display: flex;
  align-items: center;

  :first-child {
    flex-grow: 1;
  }
}
</style>
