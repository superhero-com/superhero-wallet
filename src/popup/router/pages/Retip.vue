<template>
  <div class="retip">
    <BalanceInfo />
    <div class="section-title">
      {{ $t('pages.tipPage.url') }}
    </div>

    <div class="url-bar">
      <UrlStatus :status="urlStatus" />
      <a>{{ tip.url }}</a>
    </div>

    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
      }"
      name="amount"
      class="amount-input"
      show-tokens-with-balance
      :error-message="validationStatus.msg || errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="(val) => $set(formModel, 'selectedAsset', val)"
    />
    <div
      v-if="tip.title"
      class="tip-note-preview"
    >
      {{ tip.title }}
    </div>

    <Button
      :disabled="!tippingSupported || validationStatus.error || $validator.errors.has('amount')"
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
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE } from '../../utils/constants';
import { convertToken } from '../../utils/helper';
import deeplinkApi from '../../../mixins/deeplinkApi';
import maxAmountMixin from '../../../mixins/maxAmountMixin';
import InputAmount from '../components/InputAmountV2.vue';
import UrlStatus from '../components/UrlStatus.vue';
import Button from '../components/Button.vue';
import BalanceInfo from '../components/BalanceInfo.vue';

export default {
  components: {
    InputAmount, UrlStatus, Button, BalanceInfo,
  },
  mixins: [deeplinkApi, maxAmountMixin],
  data: () => ({
    tip: {},
    formModel: {
      amount: null,
      selectedAsset: null,
    },
    loading: false,
  }),
  computed: {
    ...mapGetters(['account', 'tippingSupported']),
    ...mapGetters('fungibleTokens', ['getAeternityToken']),
    ...mapState({
      tippingV1: 'tippingV1',
      tippingV2: 'tippingV2',
      urlStatus(state, getters) {
        return getters['tipUrl/status'](this.tip.url);
      },

      validationStatus({ sdk }, { minTipAmount }) {
        if (!sdk || !this.tippingContract) {
          return { error: true };
        }
        if (this.formModel.selectedAsset.contractId !== 'aeternity'
          && this.$route.query.id.includes('_v1')) {
          return { error: true, msg: this.$t('pages.tipPage.v1FungibleTokenTipError') };
        }
        if (this.formModel.selectedAsset.contractId === 'aeternity'
          && +this.formModel.amount < minTipAmount) {
          return { error: true, msg: this.$t('pages.tipPage.minAmountError') };
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
  async created() {
    this.loading = true;
    this.formModel.selectedAsset = this.getAeternityToken({
      tokenBalance: this.balance,
      balanceCurrency: this.balanceCurrency,
    });

    const tipId = this.$route.query.id;
    if (!tipId) throw new Error('"id" param is missed');
    this.tip = await this.$store.dispatch('getCacheTip', tipId);
    this.loading = false;
  },
  methods: {
    async sendTip() {
      const amount = convertToken(
        this.formModel.amount,
        this.formModel.selectedAsset.contractId !== 'aeternity'
          ? this.formModel.selectedAsset.decimals : MAGNITUDE,
      ).toFixed();
      this.loading = true;
      await this.$watchUntilTruly(() => this.tippingV1);
      try {
        let retipResponse = null;
        if (this.formModel.selectedAsset.contractId !== 'aeternity') {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance',
            [this.formModel.selectedAsset.contractId, this.formModel.amount]);
          retipResponse = await this.tippingV2.methods.retip_token(
            +this.tip.id.split('_')[0],
            this.formModel.selectedAsset.contractId,
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
        this.$store.dispatch('addPendingTransaction', {
          hash: retipResponse.hash,
          amount,
          tipUrl: this.tip.url,
          tx: {
            callerId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'retip',
            selectedTokenId: this.formModel.selectedAsset?.contractId,
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
@use '../../../styles/typography';

.retip {
  .url-bar {
    display: flex;
    align-items: center;

    svg {
      width: 24px;
      height: 24px;
    }

    a {
      text-align: left;
      color: variables.$color-white;
      flex-grow: 1;
      text-decoration: none;
      width: 90%;
      margin: 8px 0 8px 10px;

      @extend %face-sans-11-regular;
    }
  }

  .input-field + .button {
    margin-top: 50px;
  }

  .section-title {
    margin-bottom: 8px;
    margin-top: 16px;
    color: variables.$color-white;
    text-align: left;

    @extend %face-sans-16-regular;
  }
}
</style>
