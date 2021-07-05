<template>
  <div class="retip">
    <BalanceInfo />
    <div class="section-title">
      {{ $t('pages.tipPage.url') }}
    </div>

    <div class="url-bar">
      <UrlStatus :status="urlStatus" />
      <a class="link-sm text-left">{{ tip.url }}</a>
    </div>

    <AmountInput
      v-model="amount"
      :amount-error="amount && validationStatus.error"
      :error-message="validationStatus.msg"
    />
    <div class="tip-note-preview mt-15">
      {{ tip.title }}
    </div>

    <Button
      :disabled="!tippingSupported || validationStatus.error"
      @click="sendTip"
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
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE, calculateFee } from '../../utils/constants';
import { convertToken } from '../../utils/helper';
import deeplinkApi from '../../../mixins/deeplinkApi';
import AmountInput from '../components/AmountInput';
import UrlStatus from '../components/UrlStatus';
import Button from '../components/Button';
import BalanceInfo from '../components/BalanceInfo';

export default {
  components: {
    AmountInput, UrlStatus, Button, BalanceInfo,
  },
  mixins: [deeplinkApi],
  data: () => ({
    tip: {},
    amount: '',
    loading: false,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapGetters(['account', 'tippingSupported']),
    ...mapState('fungibleTokens', ['selectedToken']),
    ...mapState({
      tippingV1: 'tippingV1',
      tippingV2: 'tippingV2',
      urlStatus(state, getters) {
        return getters['tipUrl/status'](this.tip.url);
      },

      validationStatus({ sdk }, { account, minTipAmount }) {
        if (!sdk || !this.tippingContract) {
          return { error: true };
        }
        if (this.selectedToken && this.$route.query.id.includes('_v1')) {
          return { error: true, msg: this.$t('pages.tipPage.v1FungibleTokenTipError') };
        }
        if (!+this.amount) {
          return { error: true, msg: this.$t('pages.tipPage.requiredAmountError') };
        }
        if (!this.selectedToken && +this.amount < minTipAmount) {
          return { error: true, msg: this.$t('pages.tipPage.minAmountError') };
        }
        const fee = calculateFee(SCHEMA.TX_TYPE.contractCall, {
          ...sdk.Ae.defaults,
          contractId: this.tippingContract.deployInfo.address,
          callerId: account.address,
        });
        if (
          this.selectedToken
            ? this.selectedToken.balance.comparedTo(this.amount) === -1
              || this.balance.comparedTo(fee) === -1
            : this.balance.comparedTo(fee.plus(this.amount)) === -1
        ) {
          return { error: true, msg: this.$t('pages.tipPage.insufficientBalance') };
        }
        return { error: false };
      },
    }),
    tippingContract() {
      return this.$route.query.id.includes('_v2') || this.$route.query.id.includes('_v3')
        ? this.tippingV2
        : this.tippingV1;
    },
  },
  async mounted() {
    this.loading = true;
    await this.$watchUntilTruly(() => this.tippingV1);
    const tipId = this.$route.query.id;
    if (!tipId) throw new Error('"id" param is missed');
    this.tip = await this.$store.dispatch('getCacheTip', tipId);
    this.loading = false;
  },
  methods: {
    async sendTip() {
      const amount = convertToken(
        this.amount,
        this.selectedToken ? this.selectedToken.decimals : MAGNITUDE,
      ).toFixed();
      this.loading = true;
      try {
        let retipResponse = null;
        if (this.selectedToken) {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', this.amount);
          retipResponse = await this.tippingV2.methods.retip_token(
            +this.tip.id.split('_')[0],
            this.selectedToken.contract,
            amount,
            {
              waitMined: false,
            },
          );
        } else {
          retipResponse = await this.tippingContract.methods.retip(+this.tip.id.split('_')[0], {
            amount,
            waitMined: false,
          });
        }
        this.$store.commit('addPendingTransaction', {
          hash: retipResponse.hash,
          amount,
          tipUrl: this.tip.url,
          type: 'tip',
          tx: {
            senderId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
          },
        });
        this.openCallbackOrGoHome(true);
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
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
@use '../../../styles/variables';

.retip {
  .url-bar {
    display: flex;
    align-items: center;

    a {
      color: variables.$color-white;
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
    color: variables.$color-white;
    font-weight: 400;
    text-align: left;
  }
}
</style>
