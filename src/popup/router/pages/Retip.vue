<template>
  <div class="popup">
    <p class="primary-title text-left mb-8 f-16">
      {{ $t('pages.tipPage.heading') }}
      <span class="secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
      {{ $t('pages.tipPage.to') }}
    </p>

    <div class="url-bar">
      <a class="link-sm text-left">{{ tip.url }}</a>
      <CheckIcon v-if="urlVerified" />
    </div>

    <AmountSend :amountError="amountError" @changeAmount="val => (amount = val)" :value="amount" />
    <div class="tip-note-preview mt-15">
      {{ tip.title }}
    </div>

    <Button @click="sendTip" :disabled="amountError || !minCallFee || !tipping">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="cancel">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <popup :popupSecondBtnClick="popup.secondBtnClick" />
    <Loader size="big" :loading="loading" type="transparent" content="" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import tipping from 'aepp-raendom/src/utils/tippingContractUtil';
import { MAGNITUDE, calculateFee, TX_TYPES, BACKEND_URL } from '../../utils/constants';
import { pollGetter } from '../../utils/helper';
import { setPendingTx } from '../../utils';
import openUrl from '../../utils/openUrl';
import CheckIcon from '../../../icons/check-icon.svg?vue-component';
import AmountSend from '../components/AmountSend';

export default {
  components: { AmountSend, CheckIcon },
  data: () => ({
    tip: {},
    amount: null,
    amountError: false,
    loading: false,
    minCallFee: null,
    verifiedUrls: [],
  }),
  computed: {
    ...mapGetters(['balance', 'popup', 'tipping', 'current', 'sdk', 'account', 'network', 'currentCurrency']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.minCallFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    urlVerified() {
      return this.tip.url && this.verifiedUrls.includes(new URL(this.tip.url).hostname);
    },
    urlParams() {
      return new URL(this.$route.fullPath, window.location).searchParams;
    },
  },
  watch: {
    amount() {
      this.amountError = false;
    },
    urlVerified(val) {
      if (val) this.$store.dispatch('popupAlert', { name: 'account', type: 'tip_url_verified' });
    },
  },
  async created() {
    this.loading = true;
    this.verifiedUrls = (await axios.get(`${BACKEND_URL}/verified`)).data;

    await pollGetter(() => this.sdk);
    this.minCallFee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.network[this.current.network].tipContract,
      callerId: this.account.publicKey,
    }).min;

    await pollGetter(() => this.tipping);
    const tipId = +this.urlParams.get('id');
    if (!tipId) throw new Error('"id" param is missed');
    const { decodedResult } = await this.tipping.methods.get_state();
    this.tip = tipping.getTipsRetips(decodedResult).tips.find(({ id }) => id === tipId);
    this.loading = false;
  },
  methods: {
    openCallbackOrGoHome(paramName) {
      const callbackUrl = this.urlParams.get(paramName);
      if (callbackUrl) openUrl(decodeURIComponent(callbackUrl));
      else this.$router.push('/account');
    },
    async sendTip() {
      this.amountError = !this.amount || !this.minCallFee || this.maxValue - this.amount <= 0;
      this.amountError = this.amountError || isNaN(this.amount) || this.amount <= 0;
      if (this.amountError) return;

      const amount = BigNumber(this.amount).shiftedBy(MAGNITUDE);
      this.loading = true;
      try {
        const res = await this.tipping.methods.retip(this.tip.id, { amount, waitMined: false });
        if (res.hash) {
          await setPendingTx({ hash: res.hash, amount: this.amount, domain: this.tip.url, time: Date.now(), type: 'tip' });
          this.openCallbackOrGoHome('x-success');
        }
      } catch (e) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      } finally {
        this.loading = false;
      }
    },
    cancel() {
      this.openCallbackOrGoHome('x-cancel');
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
