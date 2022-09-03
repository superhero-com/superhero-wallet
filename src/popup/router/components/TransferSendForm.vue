<template>
  <div
    class="transfer-send new-ui"
  >
    <ModalHeader
      :title="$t('modals.send.sendTitle')"
    />

    <!-- account: true,
    name_registered_address: true,
    token_to_an_address: true,
    not_same_as: account.address, -->

    <InputField
      v-model.trim="formModel.address"
      v-validate="{
        required: true,
        not_same_as: account.address,
        name_registered_address_or_url: true,
      }"
      name="address"
      data-cy="address"
      show-help
      show-message-help
      new-ui
      :label="$t('modals.send.recipientLabel')"
      :placeholder="$t('modals.send.recipientPlaceholder')"
      :error-message="isTipUrl ? null : addressErrorMsg"
      :warning-message="isTipUrl ? null : addressWarningMsg"
      :status="status"
      @help="showRecipientHelp()"
    >
      <template #label-after>
        <a
          class="scan-button"
          data-cy="scan-button"
          @click="openScanQrModal"
        >
          <QrScanIcon />
        </a>
      </template>
    </InputField>
    <div class="status">
      <UrlStatus
        v-show="isTipUrl && !checkAensName(formModel.address) && validateTipUrl(formModel.address)"
        :status="urlStatus"
      />
    </div>
    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
      }"
      name="amount"
      class="amount-input"
      :error-message="errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="handleAssetChange"
    />

    <DetailsItem
      new-ui
      :label="$t('pages.signTransaction.fee')"
    >
      <TokenAmount
        slot="value"
        :amount="+fee.toFixed()"
        symbol="AE"
        data-cy="review-fee"
      />
    </DetailsItem>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import {
  // aeToAettos,
  // convertToken,
  calculateFee,
  validateTipUrl,
  checkAensName,
} from '../../utils/helper';
import InputField from './InputField.vue';
import InputAmount from './InputAmountV2.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import ModalHeader from './ModalHeader.vue';
import UrlStatus from './UrlStatus.vue';
import {
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_INFO,
} from '../../utils/constants';

const WARNING_RULES = ['not_same_as'];

export default {
  name: 'TransferSendForm',
  components: {
    ModalHeader,
    InputField,
    InputAmount,
    DetailsItem,
    TokenAmount,
    QrScanIcon,
    UrlStatus,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
  },
  data() {
    return {
      invoiceId: null,
      warningRules: {
        address: ['not_same_as'],
      },
      invoiceContract: null,
      reviewStep: false,
      formModel: {},
      loading: false,
      fee: BigNumber(0),
      error: false,
      isTipUrl: false,
      status: '',
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, [
      'tokenBalance',
      'balanceCurrency',
    ]);
  },
  computed: {
    ...mapState([
      'current',
      'sdk',
    ]),
    ...mapState('accounts', [
      'activeIdx',
    ]),
    ...mapState('fungibleTokens', [
      'availableTokens',
    ]),
    ...mapGetters([
      'account',
      'accounts',
      'formatCurrency',
      'currentCurrencyRate',
    ]),
    ...mapGetters('fungibleTokens', [
      'tokenBalances',
      'getAeternityToken',
    ]),
    tokenSymbol() {
      return this.formModel.selectedAsset?.symbol || 'AE';
    },
    addressErrorMsg() {
      return this.errors.items
        .filter(({ field }) => field === 'address')
        .filter(({ rule }) => !WARNING_RULES.includes(rule))[0]?.msg || null;
    },
    addressWarningMsg() {
      return this.errors.items
        .filter(({ field }) => field === 'address')
        .find((error) => WARNING_RULES.includes(error.rule))?.msg || null;
    },
    urlStatus() {
      return this.$store.getters['tipUrl/status'](this.formModel.address);
    },
  },
  watch: {
    formModel: {
      deep: true,
      handler(val) {
        console.log('formModel watch', val);

        this.isTipUrl = validateTipUrl(val.address);
        if (!checkAensName(val.address) && this.isTipUrl) {
          const urlStatus = this.$store.getters['tipUrl/status'](val.address);
          switch (urlStatus) {
            case 'verified':
              this.status = 'success';
              break;
            case 'blacklisted':
              this.status = 'error';
              break;
            case 'not-secure':
              this.status = 'warning';
              break;
            case 'not-verified':
              this.status = 'warning';
              break;
            default:
              throw new Error(`Unknown url status: ${this.status}`);
          }
        } else {
          this.status = null;
        }

        this.$emit('input', {
          ...val,
          fee: this.fee,
          total: (val.selectedAsset ? 0 : +this.fee.toFixed()) + +val.amount,
        });
      },
    },
  },
  async created() {
    await this.fetchFee();

    console.log('Create form', this.transferData);

    this.formModel = this.transferData;
    if (!this.formModel.selectedAsset) {
      this.formModel.selectedAsset = this.getAeternityToken({
        tokenBalance: this.tokenBalance,
        balanceCurrency: this.balanceCurrency,
      });
    }
  },
  methods: {
    checkAensName,
    validateTipUrl,
    async queryHandler(query) {
      await this.$watchUntilTruly(() => this.sdk);
      if (query.token) {
        this.$store.commit('fungibleTokens/setSelectedToken', {
          address: this.accounts[this.activeIdx].address,
          token: this.tokenBalances.find(({ value }) => value === query.token),
        });
      }
      if (query.account) {
        this.formModel.address = query.account;
      }
      if (query.amount) {
        this.formModel.amount = query.amount;
      }
    },
    async fetchFee() {
      await this.$watchUntilTruly(() => this.sdk);
      this.fee = calculateFee(
        !this.selectedAsset ? SCHEMA.TX_TYPE.spend : SCHEMA.TX_TYPE.contractCall, {
          ...this.sdk.Ae.defaults,
          ...(this.selectedAsset && {
            callerId: this.account.address,
            contractId: this.selectedAsset.contractId,
          }),
        },
      );
    },
    // Method called from a parent scope - avoid changing it's name.
    async submit() {
      const isValid = await this.$validator.validateAll();
      console.log('submit inner', isValid, this.formModel);

      if (isValid) {
        const { address, amount, selectedAsset } = this.formModel;
        this.$emit('success', {
          address,
          amount,
          selectedAsset,
          fee: this.fee,
          total: (selectedAsset ? 0 : +this.fee.toFixed()) + +amount,
          // formModel: {
          //   tipUrl: 'test.com', // TODO - pass proper url
          //   recipientAddress: this.form.address,
          //   amount: this.form.amount,
          //   total: (this.selectedToken ? 0 : +this.fee.toFixed()) + +this.form.amount,
          //   invoiceId: this.invoiceId,
          //   contractId: this.contractId,
          // },
        });
      }
    },
    showRecipientHelp() {
      this.$store.dispatch('modals/open', {
        name: MODAL_RECIPIENT_INFO,
      });
    },
    handleAssetChange(val) {
      this.formModel.selectedAsset = val;
    },
    openScanQrModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        title: this.$t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transfer-send {
  .scan-button {
    display: block;
    width: 20px;
    height: 20px;
  }

  .amount-input {
    margin-bottom: 20px;
  }

  .status {
    margin-top: 9px;
  }
}
</style>
