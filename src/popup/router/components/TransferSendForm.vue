<template>
  <div
    class="transfer-send new-ui"
  >
    <p class="text-heading-2 text-center">
      {{ $t('modals.send.sendTitle') }}
    </p>

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
      new-ui
      :label="$t('modals.send.recipientLabel')"
      :placeholder="$t('modals.send.recipientPlaceholder')"
      :error-message="addressErrorMsg"
      :warning-message="addressWarningMsg"
      @help="showRecipientHelp()"
    >
      <template #before>
        <Valid
          v-if="!!formModel.address"
          class="valid"
        />
      </template>

      <template #label-after>
        <a
          class="scan-button"
          data-cy="scan-button"
          @click="scan"
        >
          <QrScan />
        </a>
      </template>
    </InputField>

    <RequestAmount
      v-model="formModel.amount"
      class="amount-input"
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
        hide-fiat
      />
    </DetailsItem>

    <DetailsItem
      new-ui
      :label="$t('pages.signTransaction.total')"
    >
      <TokenAmount
        slot="value"
        :amount="(selectedToken ? 0 : +fee.toFixed()) + +formModel.amount"
        :symbol="tokenSymbol"
        :hide-fiat="!!selectedToken"
        data-cy="review-total"
        high-precision
      />
    </DetailsItem>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { MODAL_DEFAULT, MODAL_READ_QR_CODE } from '../../utils/constants';
import {
  aeToAettos,
  convertToken,
  calculateFee,
} from '../../utils/helper';
import InputField from './InputField.vue';
import RequestAmount from './RequestAmount.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import Valid from '../../../icons/valid.svg?vue-component';
import QrScan from '../../../icons/qr-scan.svg?vue-component';

const WARNING_RULES = ['not_same_as'];

export default {
  components: {
    InputField,
    RequestAmount,
    DetailsItem,
    TokenAmount,
    Valid,
    QrScan,
  },
  data() {
    return {
      invoiceId: null,
      warningRules: {
        address: ['not_same_as'],
      },
      invoiceContract: null,
      reviewStep: false,
      formModel: {
        address: '',
        amount: null,
        selectedAsset: null,
      },
      loading: false,
      fee: BigNumber(0),
      error: false,
    };
  },
  computed: {
    ...mapState('accounts', [
      'activeIdx',
    ]),
    ...mapState('fungibleTokens', [
      'availableTokens',
    ]),
    ...mapState([
      'current',
      'sdk',
    ]),
    ...mapGetters([
      'account',
      'accounts',
      'formatCurrency',
      'currentCurrencyRate',
    ]),
    ...mapGetters('fungibleTokens', [
      'selectedToken',
      'tokenBalances',
    ]),
    tokenSymbol() {
      return this.selectedToken ? this.selectedToken.symbol : 'AE';
    },
    addressErrorMsg() {
      return this.errors.items
        .filter((error) => !WARNING_RULES.includes(error.rule))[0]?.msg || null;
    },
    addressWarningMsg() {
      return this.errors.items
        .find((error) => WARNING_RULES.includes(error.rule))?.msg || null;
    },
  },
  watch: {
    formModel: {
      deep: true,
      immediate: true,
      handler(val) {
        this.$emit('input', val);
      },
    },
    async selectedToken() {
      await this.$validator.validateAll(this.warningRules);
      this.fetchFee();
    },
  },
  async created() {
    await this.fetchFee();
  },
  methods: {
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
    async validate() {
      if (await this.$validator.validateAll(this.warningRules)) this.reviewStep = true;
    },
    async scan() {
      const scanResult = await this.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        title: this.$t('pages.send.scanAddress'),
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
            name: MODAL_DEFAULT,
            title: this.$t('modals.invalid-qr-code.msg'),
            icon: 'critical',
          });
          return;
        }

        // does user have the requested tokens?
        const requestedTokenBalance = this.tokenBalances
          .find(({ value }) => value === parsedScanResult.tokenContract);
        if (!requestedTokenBalance) {
          this.$store.dispatch('modals/open', { name: MODAL_DEFAULT, type: 'insufficient-balance' });
          this.formModel.address = '';
          return;
        }

        // select requested token
        this.$store.commit('fungibleTokens/setSelectedToken', {
          address: this.accounts[this.activeIdx].address,
          token: this.tokenBalances
            .find(({ value }) => value === parsedScanResult.tokenContract),
        });
        // SET result data
        this.formModel.address = parsedScanResult.tokenContract;
        this.formModel.amount = +convertToken(
          parsedScanResult.amount,
          -this.selectedToken.decimals,
        );
        this.invoiceId = parsedScanResult.invoiceId;
        this.invoiceContract = parsedScanResult.invoiceContract;

        await this.validate();
      } else {
        if (!scanResult) return;
        if (scanResult.startsWith('ak_')) {
          this.formModel.address = scanResult;
        } else {
          this.queryHandler([
            ...new URL(scanResult).searchParams.entries(),
          ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
        }
        this.invoiceId = null;
      }
      if (!this.formModel.address) {
        this.formModel.address = '';
      }
    },
    async fetchFee() {
      await this.$watchUntilTruly(() => this.sdk);
      this.fee = calculateFee(
        !this.selectedToken ? SCHEMA.TX_TYPE.spend : SCHEMA.TX_TYPE.contractCall, {
          ...this.sdk.Ae.defaults,
          ...(this.selectedToken && {
            callerId: this.account.address,
            contractId: this.selectedToken.contractId,
          }),
        },
      );
    },
    async send() {
      const amount = !this.selectedToken
        ? aeToAettos(this.formModel.amount)
        : convertToken(this.formModel.amount, this.selectedToken.decimals);
      const receiver = this.formModel.address;
      this.loading = true;
      try {
        if (this.selectedToken && this.invoiceId !== null) {
          const { hash } = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            this.formModel.amount,
            this.invoiceContract,
            this.invoiceId,
            { waitMined: false, modal: false },
          ]);
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipient: receiver,
            pendingTokenTx: true,
            tx: {
              callerId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: 'transfer',
            },
          });
        } else if (this.selectedToken) {
          const { hash } = await this.$store.dispatch('fungibleTokens/transfer', [
            receiver,
            this.formModel.amount,
            { waitMined: false, modal: false },
          ]);
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipient: receiver,
            pendingTokenTx: true,
            tx: {
              callerId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: 'transfer',
            },
          });
        } else {
          const { hash } = await this.sdk.spend(amount, receiver, {
            waitMined: false,
            modal: false,
          });
          this.$store.dispatch('addPendingTransaction', {
            hash,
            amount,
            type: 'spend',
            tx: {
              senderId: this.account.address,
              recipientId: this.formModel.address,
              type: SCHEMA.TX_TYPE.spend,
            },
          });
        }
        this.$router.push('/account');
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        throw e;
      } finally {
        this.loading = false;
      }
    },
    showRecipientHelp() {
      // TODO - in separate task
    },
    handleAssetChange(val) {
      this.formModel.selectedAsset = val;
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
}
</style>
