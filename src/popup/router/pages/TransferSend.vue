<template>
  <div class="transfer-send">
    <div
      v-if="!reviewStep"
      class="send"
    >
      <InputField
        v-model.trim="form.address"
        v-validate="{
          required: true,
          account: true,
          name_registered_address: true,
          token_to_an_address: true,
          not_same_as: account.address
        }"
        name="address"
        :placeholder="$t('pages.send.addressPlaceholder')"
        :error="$validator._base.anyExcept('address', warningRules.address)"
        :error-message="$validator._base.firstExcept('address', warningRules.address)"
        :warning="errors.anyByRules('address', warningRules.address)"
        :warning-message="errors.firstByRules('address', warningRules.address)"
        data-cy="address"
        @scan="scan"
      >
        <Valid
          v-if="!!form.address"
          slot="left"
          class="valid"
        />
        <span
          slot="label"
          data-cy="title"
        >
          {{ $t('pages.tipPage.heading') }}
          <span class="token-symbol">
            {{ tokenSymbol }}
          </span>
          {{ $t('pages.tipPage.to') }}
        </span>
        <button
          slot="buttons"
          data-cy="scan-button"
          @click="scan"
        >
          <QrScan />
        </button>
      </InputField>

      <InputAmount
        v-model="form.amount"
        @error="(val) => error = val"
      />
    </div>
    <div
      v-else
      class="review"
    >
      <h1>{{ $t('pages.send.reviewtx') }}</h1>
      <h2>{{ $t('pages.send.checkalert') }}</h2>
      <DetailsItem
        :value="account.address"
        :label="$t('pages.send.sender')"
        small
        data-cy="review-sender"
      />
      <DetailsItem
        :value="form.address"
        :label="$t('pages.send.recipient')"
        small
        data-cy="review-recipient"
      />
    </div>

    <DetailsItem :label="$t('pages.signTransaction.fee')">
      <TokenAmount
        slot="value"
        :amount="+fee.toFixed()"
        symbol="AE"
        hide-fiat
        data-cy="review-fee"
      />
    </DetailsItem>
    <DetailsItem :label="$t('pages.signTransaction.total')">
      <TokenAmount
        slot="value"
        :amount="(selectedToken ? 0 : +fee.toFixed()) + +form.amount"
        :symbol="tokenSymbol"
        high-precision
        :hide-fiat="!!selectedToken"
        data-cy="review-total"
      />
    </DetailsItem>

    <Button
      v-if="!reviewStep"
      data-cy="review-withdraw"
      :disabled="
        !form.address
          || !form.amount
          || $validator._base.anyExcept('address', warningRules.address)
          || error"
      @click="validate"
    >
      {{ $t('pages.send.review') }}
    </Button>

    <div
      v-if="reviewStep"
      class="review-buttons"
    >
      <Button
        data-cy="reivew-editTxDetails-button"
        half
        dark
        fill="secondary"
        @click="reviewStep = false"
      >
        {{ $t('pages.send.editTxDetails') }}
      </Button>
      <Button
        data-cy="review-send-button"
        third
        :disabled="sdk ? false : true"
        @click="send"
      >
        {{ $t('pages.send.send') }}
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { calculateFee } from '../../utils/constants';
import { checkAensName, aeToAettos, convertToken } from '../../utils/helper';
import InputField from '../components/InputField.vue';
import InputAmount from '../components/InputAmount.vue';
import Button from '../components/Button.vue';
import DetailsItem from '../components/DetailsItem.vue';
import TokenAmount from '../components/TokenAmount.vue';
import Valid from '../../../icons/valid.svg?vue-component';
import QrScan from '../../../icons/qr-scan.svg?vue-component';

export default {
  components: {
    InputField,
    InputAmount,
    Button,
    Valid,
    QrScan,
    DetailsItem,
    TokenAmount,
  },
  props: {
    address: { type: String, default: '' },
  },
  data() {
    return {
      invoiceId: null,
      warningRules: {
        address: ['not_same_as'],
      },
      invoiceContract: null,
      reviewStep: false,
      form: {
        address: '',
        amount: '',
      },
      loading: false,
      fee: BigNumber(0),
      error: false,
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapState(['current', 'sdk']),
    ...mapGetters(['account', 'formatCurrency', 'currentCurrencyRate', 'accounts']),
    ...mapGetters('fungibleTokens', ['selectedToken', 'tokenBalances']),
    tokenSymbol() {
      return this.selectedToken ? this.selectedToken.symbol : 'AE';
    },
  },
  watch: {
    async selectedToken() {
      await this.$validator.validateAll(this.warningRules);
      this.fetchFee();
    },
    $route: {
      immediate: true,
      async handler({ query }) {
        await this.queryHandler(query);
      },
    },
  },
  async mounted() {
    if (typeof this.address !== 'undefined') {
      this.form.address = this.address;
    }
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
      if (query.account) this.form.address = query.account;
      if (query.amount) this.form.amount = query.amount;
    },
    checkAensName,
    async validate() {
      if (await this.$validator.validateAll(this.warningRules)) this.reviewStep = true;
    },
    async scan() {
      const scanResult = await this.$store.dispatch('modals/open', {
        name: 'read-qr-code',
        title: this.$t('pages.send.scanAddress'),
      });
      if (scanResult?.trim().charAt(0) === '{') {
        let parsedScanResult = null;
        try {
          parsedScanResult = JSON.parse(scanResult);
        } catch (e) {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.error(e);
          this.form.address = '';
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
          this.form.address = '';
          this.$store.dispatch('modals/open', { name: 'default', type: 'insufficient-balance' });
          this.form.address = '';
          return;
        }

        // select requested token
        this.$store.commit('fungibleTokens/setSelectedToken', {
          address: this.accounts[this.activeIdx].address,
          token: this.tokenBalances.find(({ value }) => value === parsedScanResult.tokenContract),
        });
        // SET result data
        this.form.address = parsedScanResult.tokenContract;
        this.form.amount = +convertToken(
          parsedScanResult.amount,
          -this.selectedToken.decimals,
        );
        this.invoiceId = parsedScanResult.invoiceId;
        this.invoiceContract = parsedScanResult.invoiceContract;

        await this.validate();
      } else {
        if (!scanResult) return;
        if (scanResult.startsWith('ak_')) this.form.address = scanResult;
        else {
          this.queryHandler([
            ...new URL(scanResult).searchParams.entries(),
          ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
        }
        this.invoiceId = null;
      }
      if (!this.form.address) this.form.address = '';
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
        ? aeToAettos(this.form.amount)
        : convertToken(this.form.amount, this.selectedToken.decimals);
      const receiver = this.form.address;
      this.loading = true;
      try {
        if (this.selectedToken && this.invoiceId !== null) {
          const { hash } = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            this.form.amount,
            this.invoiceContract,
            this.invoiceId,
            { waitMined: false, modal: false },
          ]);
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipientId: receiver,
            pendingTokenTx: true,
            tx: {
              senderId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
            },
          });
        } else if (this.selectedToken) {
          const { hash } = await this.$store.dispatch('fungibleTokens/transfer', [
            receiver,
            this.form.amount,
            { waitMined: false, modal: false },
          ]);
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipientId: receiver,
            pendingTokenTx: true,
            tx: {
              senderId: this.account.address,
              contractId: this.selectedToken.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
            },
          });
        } else {
          const { hash } = await this.sdk.spend(amount, receiver, {
            waitMined: false,
            modal: false,
          });
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spend',
            tx: {
              senderId: this.account.address,
              recipientId: this.form.address,
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
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transfer-send {
  padding: 16px;

  .send {
    .token-symbol {
      color: variables.$color-blue;
    }

    .valid {
      color: variables.$color-green;
    }

    .input-amount {
      margin-bottom: 24px;
    }
  }

  .review {
    h1,
    h2 {
      text-align: center;
    }

    h1 {
      @extend %face-sans-20-medium;

      font-size: 19px;
    }

    h2 {
      margin-bottom: 16px;

      @extend %face-sans-16-medium;

      color: variables.$color-light-grey;
    }

    .details-item {
      margin-bottom: 24px;

      ::v-deep .value {
        margin: 0;
        color: variables.$color-light-grey;
      }
    }
  }

  .details-item {
    display: inline-block;
    margin-right: 24px;
  }

  .button {
    margin-top: 24px;
    margin-bottom: 36px;
  }

  .review-buttons {
    display: flex;
    justify-content: space-around;
  }
}
</style>
