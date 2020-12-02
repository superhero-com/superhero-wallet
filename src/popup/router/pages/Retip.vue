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
    amount: '',
    loading: false,
  }),
  computed: {
    ...mapGetters(['tippingSupported']),
    ...mapState({
      tippingV1: 'tippingV1',
      urlStatus(state, getters) {
        return getters['tipUrl/status'](this.tip.url);
      },
      isMinTipAmountError(state, { minTipAmount }) {
        return this.amount < minTipAmount;
      },
      isAmountValid({ sdk, balance }, { account, activeNetwork }) {
        if (!sdk) return false;
        const fee = calculateFee(TX_TYPES.contractCall, {
          ...sdk.Ae.defaults,
          contractId: activeNetwork.tipContractV1,
          callerId: account.publicKey,
        });
        return !this.isMinTipAmountError && balance - fee - this.amount >= 0;
      },
    }),
  },
  async created() {
    this.loading = true;
    await this.$watchUntilTruly(() => this.tippingV1);
    const tipId = +this.$route.query.id;
    if (!tipId) throw new Error('"id" param is missed');
    const { decodedResult } = await this.tippingV1.methods.get_state();
    this.tip = tipping.getTipsRetips(decodedResult).tips.find(({ id }) => id === tipId);
    this.loading = false;
  },
  methods: {
    async sendTip() {
      const amount = BigNumber(this.amount).shiftedBy(MAGNITUDE);
      this.loading = true;
      try {
        const { hash } = await this.tippingV1.methods.retip(this.tip.id, {
          amount,
          waitMined: false,
          modal: false,
        });
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
