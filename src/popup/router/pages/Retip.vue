<template>
  <div class="popup">
    <div class="section-title">
      {{ $t('pages.tipPage.url') }}
    </div>

    <div class="url-bar">
      <UrlStatus :status="urlStatus" info />
      <a class="link-sm text-left">{{ tip.url }}</a>
    </div>

    <AmountSend
      :amountError="amountError"
      v-model="amount"
      :errorMsg="amount && amount < minTipAmount"
    />
    <div class="tip-note-preview mt-15">
      {{ tip.title }}
    </div>

    <Button
      @click="sendTip"
      :disabled="amountError || !minCallFee || !tippingV1 || !tippingSupported"
    >
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="openCallbackOrGoHome(false)">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import tipping from 'aepp-raendom/src/utils/tippingContractUtil';
import { MAGNITUDE, calculateFee, TX_TYPES } from '../../utils/constants';
import deeplinkApi from '../../../mixins/deeplinkApi';
import AmountSend from '../components/AmountSend';
import UrlStatus from '../components/UrlStatus';
import Button from '../components/Button';

export default {
  mixins: [deeplinkApi],
  components: { AmountSend, UrlStatus, Button },
  data: () => ({
    tip: {},
    amount: null,
    amountError: false,
    loading: false,
    minCallFee: null,
  }),
  computed: {
    ...mapGetters(['account', 'tippingSupported', 'minTipAmount', 'activeNetwork']),
    ...mapState(['balance', 'tippingV1', 'sdk']),
    urlStatus() {
      return this.$store.getters['tipUrl/status'](this.tip.url);
    },
  },
  watch: {
    amount() {
      this.amountError = !+this.amount || this.amount < this.minTipAmount;
    },
  },
  async created() {
    this.loading = true;
    await this.$watchUntilTruly(() => this.sdk);
    this.minCallFee = calculateFee(TX_TYPES.contractCall, {
      ...this.sdk.Ae.defaults,
      contractId: this.activeNetwork.tipContractV1,
      callerId: this.account.publicKey,
    }).min;
    await this.$watchUntilTruly(() => this.tippingV1);
    const tipId = +this.$route.query.id;
    if (!tipId) throw new Error('"id" param is missed');
    const { decodedResult } = await this.tippingV1.methods.get_state();
    this.tip = tipping.getTipsRetips(decodedResult).tips.find(({ id }) => id === tipId);
    this.loading = false;
  },
  methods: {
    async sendTip() {
      const calculatedMaxValue =
        this.balance > this.minCallFee ? this.balance - this.minCallFee : 0;
      this.amountError = !this.amount || !this.minCallFee || calculatedMaxValue - this.amount <= 0;
      this.amountError = this.amountError || !+this.amount || this.amount < this.minTipAmount;
      if (this.amountError) return;
      const amount = BigNumber(this.amount).shiftedBy(MAGNITUDE);
      this.loading = true;
      try {
        const { hash } = await this.tippingV1.methods.retip(this.tip.id, {
          amount,
          waitMined: false,
          modal: false,
        });
        if (hash) {
          await this.$store.dispatch('handlePendingTransaction', {
            hash,
            amount: this.amount,
            domain: this.tip.url,
            time: Date.now(),
            type: 'tip',
          });
          this.openCallbackOrGoHome(true);
        }
      } catch (e) {
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
        e.payload = this.tip;
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.url-bar {
  display: flex;
  align-items: center;

  a {
    color: $text-color;
    flex-grow: 1;
    text-decoration: none;
    width: 90%;
    margin-left: 10px;
  }
}

.section-title {
  margin-bottom: 8px;
  margin-top: 16px;
  font-size: 16px;
  color: $white-color;
  font-weight: 400;
  text-align: left;
}
</style>
