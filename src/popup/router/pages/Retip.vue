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
      :amountError="amount && !isAmountValid"
      v-model="amount"
      :errorMsg="amount && isMinTipAmountError ? $t('pages.tipPage.minAmountError') : ''"
    />
    <div class="tip-note-preview mt-15">
      {{ tip.title }}
    </div>

    <Button @click="sendTip" :disabled="!isAmountValid || !tippingV1 || !tippingSupported">
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
import tipping from 'tipping-contract/util/tippingContractUtil';
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
    amount: '',
    loading: false,
    minCallFee: null,
    tippingContract: null,
  }),
  computed: {
    ...mapGetters(['account', 'tippingSupported', 'minTipAmount', 'activeNetwork']),
    ...mapState(['balance', 'tippingV1', 'tippingV2', 'sdk']),
    urlStatus() {
      return this.$store.getters['tipUrl/status'](this.tip.url);
    },
    shouldUseV2Contract() {
      return this.$route.query.id.includes('_v2') || this.$route.query.id.includes('_v3');
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
      contractId: this.shouldUseV2Contract
        ? this.activeNetwork.tipContractV2
        : this.activeNetwork.tipContractV1,
      callerId: this.account.publicKey,
    }).min;
    await this.$watchUntilTruly(() => this.tippingV1, this.tippingV2);
    const tipId = this.$route.query.id;
    if (!tipId) throw new Error('"id" param is missed');
    this.tippingContract = this.shouldUseV2Contract ? this.tippingV2 : this.tippingV1;
    const state = await this.tippingContract.methods.get_state();
    const tipsAndRetips = await tipping.getTipsRetips(state);
    this.tip = tipsAndRetips.tips.find(({ id }) => id === tipId);
    this.loading = false;
  },
  methods: {
    async sendTip() {
      const amount = BigNumber(this.amount).shiftedBy(MAGNITUDE);
      this.loading = true;
      try {
        const { hash } = await this.tippingContract.methods.retip(
          Number(this.tip.id.split('_')[0]),
          {
            amount,
            waitMined: false,
            modal: false,
          },
        );
        if (hash) {
          this.$store.commit('addPendingTransaction', {
            hash,
            amount: this.amount,
            domain: this.tip.url,
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
@import '../../../styles/variables';

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
