<template>
  <div class="transfer-send new-ui">
    <ModalHeader :title="$t('modals.send.sendTitle')" />
    <AccountRow />
    <InputField
      v-model.trim="formModel.address"
      v-validate="{
        required: true,
        not_same_as: account.address,
        name_registered_address_or_url: true,
        token_to_an_address: { isToken },
      }"
      name="address"
      data-cy="address"
      show-help
      show-message-help
      new-ui
      :label="$t('modals.send.recipientLabel')"
      :placeholder="$t('modals.send.recipientPlaceholder')"
      :message="message"
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
        v-show="isTipUrl"
        :status="urlStatus"
      />
    </div>
    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
        min_tip_amount: isTipUrl,
      }"
      name="amount"
      class="amount-input"
      show-tokens-with-balance
      :message="errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="handleAssetChange"
    >
      <template #label-after>
        <ButtonPlain
          class="max-button"
          :class="{ chosen: isMaxValue }"
          @click="setMaxValue"
        >
          MAX
        </ButtonPlain>
      </template>
    </InputAmount>

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
import maxAmountMixin from '../../../mixins/maxAmountMixin';
import {
  convertToken, isEqual, validateTipUrl, checkAensName,
} from '../../utils/helper';
import AccountRow from './AccountRow.vue';
import InputField from './InputField.vue';
import InputAmount from './InputAmountV2.vue';
import ButtonPlain from './ButtonPlain.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import ModalHeader from './ModalHeader.vue';
import UrlStatus from './UrlStatus.vue';
import {
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_INFO,
  AETERNITY_CONTRACT_ID,
} from '../../utils/constants';

const WARNING_RULES = ['not_same_as'];

export default {
  name: 'TransferSendForm',
  components: {
    ModalHeader,
    AccountRow,
    InputField,
    InputAmount,
    ButtonPlain,
    DetailsItem,
    TokenAmount,
    QrScanIcon,
    UrlStatus,
  },
  mixins: [maxAmountMixin],
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
  },
  data() {
    return {
      invoiceId: null,
      invoiceContract: null,
      formModel: {},
      loading: false,
      error: false,
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, [
      'balance',
      'balanceCurrency',
    ]);
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters('fungibleTokens', ['getAeternityToken']),
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
    isTipUrl() {
      return validateTipUrl(this.formModel.address) && !checkAensName(this.formModel.address);
    },
    message() {
      if (this.isTipUrl) {
        switch (this.urlStatus) {
          case 'verified': return { status: 'success', text: ' ', hideMessage: true };
          case 'not-secure': return { status: 'warning', text: ' ', hideMessage: true };
          case 'not-verified': return { status: 'warning', text: ' ', hideMessage: true };
          case 'blacklisted': return { status: 'error', text: ' ', hideMessage: true };
          default:
            throw new Error(`Unknown url status: ${this.message.status}`);
        }
      } else {
        const warning = this.errors.items
          .filter(({ field }) => field === 'address')
          .find((error) => WARNING_RULES.includes(error.rule))?.msg || null;
        if (warning) return { status: 'warning', text: warning };
        const error = this.errors.items
          .filter(({ field }) => field === 'address')
          .filter(({ rule }) => !WARNING_RULES.includes(rule))[0]?.msg || null;
        if (error) return { status: 'error', text: error };
      }
      return { status: 'success' };
    },
    hasError() {
      return !!this.addressErrorMsg || !!this.errors.first('amount');
    },
    isToken() {
      return this.formModel.selectedAsset?.contractId
          && this.formModel.selectedAsset.contractId !== AETERNITY_CONTRACT_ID;
    },
    isMaxValue() {
      return isEqual(this.formModel.amount, this.max);
    },
  },
  watch: {
    hasError(value) {
      return this.$emit('error', value);
    },
    formModel: {
      deep: true,
      handler(val) {
        this.$emit('input', {
          ...val,
          fee: this.fee,
          total: (val.selectedAsset.contractId === AETERNITY_CONTRACT_ID
            ? +this.fee.toFixed() : 0) + +val.amount,
        });
      },
    },
  },
  created() {
    this.formModel = this.transferData;
    if (!this.formModel.selectedAsset) {
      this.formModel.selectedAsset = this.getAeternityToken({
        tokenBalance: this.balance,
        balanceCurrency: this.balanceCurrency,
      });
    }
    const tipUrlEncoded = this.$route.query.url;
    if (tipUrlEncoded) {
      const tipUrl = decodeURIComponent(tipUrlEncoded);
      const tipUrlNormalised = new URL(/^\w+:\D+/.test(tipUrl) ? tipUrl : `https://${tipUrl}`);
      this.formModel.address = tipUrlNormalised.toString();
    }
    this.queryHandler(this.$route.query);
  },
  methods: {
    checkAensName,
    validateTipUrl,
    async queryHandler(query) {
      this.formModel.selectedAsset = this.availableTokens[query.token]
        ?? this.getAeternityToken({
          tokenBalance: this.balance,
          balanceCurrency: this.balanceCurrency,
        });

      if (query.account) this.formModel.address = query.account;
      if (query.amount) this.formModel.amount = query.amount;
    },
    setMaxValue() {
      const { fee } = this;
      this.$set(this.formModel, 'amount', this.max);
      setTimeout(() => {
        if (fee !== this.fee) {
          this.$set(this.formModel, 'amount', this.max);
        }
      },
      100);
    },
    // Method called from a parent scope - avoid changing it's name.
    async submit() {
      const isValid = !(await this.$validator._base.anyExcept('address', WARNING_RULES));

      if (isValid) {
        const { address, amount, selectedAsset } = this.formModel;
        this.$emit('success', {
          address,
          amount,
          selectedAsset,
          fee: this.fee,
          total: (selectedAsset.contractId === AETERNITY_CONTRACT_ID ? +this.fee : 0) + +amount,
          invoiceId: this.invoiceId,
          invoiceContract: this.invoiceContract,
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
    async openScanQrModal() {
      const scanResult = await this.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        title: this.$t('pages.send.scanAddress'),
        icon: 'critical',
      });
      if (scanResult?.trim().charAt(0) === '{') {
        let parsedScanResult = null;
        try {
          parsedScanResult = JSON.parse(scanResult);
        } catch (e) {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.error(e);
          this.formModel.address = '';
          this.$store.dispatch('modals/open', {
            name: 'default',
            title: this.$t('modals.invalid-qr-code.msg'),
            icon: 'critical',
          });
          return;
        }
        // does user have the requested tokens?
        const requestedTokenBalance = this.tokenBalances
          .find(({ value }) => value === parsedScanResult.tokenContract);
        if (!requestedTokenBalance) {
          this.formModel.address = '';
          this.$store.dispatch('modals/open', { name: 'default', type: 'insufficient-balance' });
          this.formModel.address = '';
          return;
        }

        // select requested token
        this.formModel.selectedAsset = this.tokenBalances
          .find(({ value }) => value === parsedScanResult.tokenContract);

        // SET result data
        this.formModel.address = parsedScanResult.tokenContract;
        this.formModel.amount = +convertToken(
          parsedScanResult.amount,
          -this.formModel.selectedAsset.decimals,
        );
        this.invoiceId = parsedScanResult.invoiceId;
        this.invoiceContract = parsedScanResult.invoiceContract;
        await this.validate();
      } else {
        if (!scanResult) return;
        if (scanResult.startsWith('ak_')) this.formModel.address = scanResult;
        else {
          this.queryHandler([
            ...new URL(scanResult).searchParams.entries(),
          ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
        }
        this.invoiceId = null;
      }
      if (!this.formModel.address) this.formModel.address = '';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transfer-send {
  .scan-button {
    color: variables.$color-white;
    display: block;
    width: 32px;
    height: 24px;
  }

  .amount-input {
    margin-bottom: 20px;
  }

  .status {
    margin-top: 9px;
  }

  .max-button {
    padding: 2px 8px;
    color: variables.$color-primary;

    @extend %face-sans-14-medium;

    line-height: 20px;
    border: 2px solid transparent;
    border-radius: 12px;

    &:hover {
      background: rgba(variables.$color-primary, 0.15);
    }

    &.chosen {
      background: rgba(variables.$color-primary, 0.15);
      border-color: rgba(variables.$color-primary, 0.5);
    }
  }
}
</style>
