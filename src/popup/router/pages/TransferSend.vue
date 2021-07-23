<template>
  <div class="transfer-send">
    <div data-cy="send-container">
      <div v-if="step == 1">
        <div class="withdraw step1">
          <p class="primary-title text-left mb-8 f-16">
            {{ $t('pages.tipPage.heading') }}
            <span class="secondary-text">{{
              selectedToken ? selectedToken.symbol : $t('ae')
            }}</span>
            {{ $t('pages.tipPage.to') }}
          </p>
          <div :class="['d-flex', { 'error-below': form.address.length > 0 && !validAddress }]">
            <Textarea
              v-model.trim="form.address"
              :type="address"
              data-cy="address"
              :error="form.address.length > 0 && !validAddress"
              :placeholder="selectedToken ? 'ak..' : 'ak.. / name.chain'"
              size="h-50"
            />
            <div
              class="scan"
              data-cy="scan-button"
              @click="scan"
            >
              <QrIcon />
              <small>{{ $t('pages.send.scan') }}</small>
            </div>
          </div>
          <div
            v-show="form.address.length > 0 && !validAddress"
            class="error"
          >
            {{
              selectedToken && form.address.length && checkAensName(form.address)
                ? $t('pages.send.error-name-send')
                : $t('pages.send.error')
            }}
          </div>
          <AmountInput
            v-model="form.amount"
            :error="form.amount.length > 0 && form.amount <= 0"
          />
          <div class="flex flex-align-center flex-justify-between">
            <Button
              data-cy="reject-withdraw"
              half
              @click="$router.push('/account')"
            >
              {{
                $t('pages.send.cancel')
              }}
            </Button>
            <Button
              data-cy="review-withdraw"
              half
              :disabled="!validAddress || !+form.amount || form.amount <= 0"
              @click="step = 2"
            >
              {{ $t('pages.send.review') }}
            </Button>
          </div>
        </div>
      </div>
      <div v-if="step == 2">
        <div class="withdraw step2">
          <h3 class="heading-1 my-15 center">
            <div class="flex flex-align-center flex-justify-content-center">
              <AlertExclamination />
              <span class="ml-7">{{ $t('pages.send.reviewtx') }}</span>
            </div>
          </h3>
          <p class="primary-title primary-title-darker text-left my-5 f-16">
            {{ $t('pages.send.checkalert') }}
          </p>
          <InfoGroup
            :value="account.address"
            :label="$t('pages.send.sender')"
            data-cy="review-sender"
          />
          <InfoGroup
            :value="form.address"
            :label="$t('pages.send.recipient')"
            data-cy="review-recipient"
          />
          <InfoGroup :label="$t('pages.send.amount')">
            <div class="text-center">
              <span
                data-cy="review-amount"
                class="amount"
              >{{ parseFloat(form.amount) }}
                {{ selectedToken ? selectedToken.symbol : $t('ae') }}</span>
              <span
                v-if="!selectedToken"
                class="currencyamount"
              >
                ~
                <span>
                  {{ formatCurrency((form.amount * currentCurrencyRate).toFixed(3)) }}
                </span>
              </span>
            </div>
          </InfoGroup>
          <Button
            data-cy="reivew-editTxDetails-button"
            extend
            @click="step = 1"
          >
            {{
              $t('pages.send.editTxDetails')
            }}
          </Button>
          <div class="flex flex-align-center flex-justify-between">
            <Button
              data-cy="review-cancel-button"
              half
              @click="$router.push('/account')"
            >
              {{
                $t('pages.send.cancel')
              }}
            </Button>
            <Button
              data-cy="review-send-button"
              half
              :disabled="sdk ? false : true"
              @click="send"
            >
              {{ $t('pages.send.send') }}
            </Button>
          </div>
        </div>
      </div>
      <div v-if="step == 3">
        <div class="withdraw step2">
          <h3 class="heading-1 my-15 center">
            <div class="flex flex-align-center flex-justify-content-center">
              <span class="ml-7">{{ $t('pages.send.tx-success') }}</span>
            </div>
          </h3>
          <p class="primary-title primary-title-darker text-left my-5 f-16">
            <span>{{ $t('pages.send.successalert') }}</span>
            <span class="secondary-text ml-5">
              {{ parseFloat(successTx.amount) }}
              {{ successTx.token ? availableTokens[successTx.token].symbol : $t('ae') }}</span>
          </p>
          <InfoGroup
            :value="successTx.to"
            :label="$t('pages.send.to')"
          />
          <InfoGroup
            :value="successTx.from"
            :label="$t('pages.send.from')"
          />
          <InfoGroup
            :value="successTx.hash"
            :label="$t('pages.send.hash')"
          />
          <Button to="/account">
            {{ $t('pages.titles.home') }}
          </Button>
        </div>
      </div>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { calculateFee, ZEIT_TOKEN_CONTRACT, ZEIT_INVOICE_CONTRACT } from '../../utils/constants';
import {
  checkAddress, checkAensName, aeToAettos, convertToken,
} from '../../utils/helper';
import AmountInput from '../components/AmountInput';
import InfoGroup from '../components/InfoGroup';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import QrIcon from '../../../icons/qr-code.svg?vue-component';
import AlertExclamination from '../../../icons/alert-exclamation.svg?vue-component';

export default {
  components: {
    AmountInput,
    Textarea,
    Button,
    QrIcon,
    AlertExclamination,
    InfoGroup,
  },
  props: {
    address: { type: String, default: '' },
    redirectstep: { type: Number, default: 0 },
    successtx: { type: Object, default: null },
  },
  data() {
    return {
      step: 1,
      invoiceId: null,
      form: {
        address: '',
        amount: '',
      },
      loading: false,
      fee: 0,
      successTx: {
        amount: '',
        from: '',
        to: '',
        hash: '',
      },
    };
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapState(['current', 'sdk', 'accountSelectedIdx']),
    ...mapGetters(['account', 'formatCurrency', 'currentCurrencyRate', 'accounts']),
    ...mapGetters('fungibleTokens', ['selectedToken', 'tokenBalances']),
    validAddress() {
      return checkAddress(this.form.address)
        || (!this.selectedToken && checkAensName(this.form.address));
    },
  },
  watch: {
    selectedToken() {
      this.fetchFee();
    },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  async mounted() {
    if (this.redirectstep && this.successtx) {
      this.step = 3;
      this.setTxDetails(this.successtx);
    }
    if (typeof this.address !== 'undefined') {
      this.form.address = this.address;
    }
    this.fetchFee();
  },
  methods: {
    checkAensName,
    async scan() {
      const scanResult = await this.$store.dispatch('modals/open', {
        name: 'read-qr-code',
        title: this.$t('pages.send.scanAddress'),
      });
      if (scanResult?.indexOf('ZEITFESTIVAL') === 0) {
        // does user have zeit tokens?
        const zeitTokenBalance = this.tokenBalances
          .find(({ value }) => value === ZEIT_TOKEN_CONTRACT);
        if (!zeitTokenBalance) {
          this.form.address = '';
          this.$store.dispatch('modals/open', { name: 'default', type: 'insufficient-balance' });
          this.form.address = '';
          return;
        }

        // Parse the qr message
        let data = {};
        try {
          data = JSON.parse(scanResult.replace('ZEITFESTIVAL', ''));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Could not parse JSON. Data corrupted?');
        }

        // SELECT ZEIT TOKEN
        this.$store.commit('fungibleTokens/setSelectedToken', {
          address: this.accounts[this.accountSelectedIdx].address,
          token: this.tokenBalances.find(({ value }) => value === ZEIT_TOKEN_CONTRACT),
        });
        // SET result data
        this.form.address = ZEIT_TOKEN_CONTRACT;
        this.form.amount = data.amount;
        this.invoiceId = data.invoiceId;

        this.step = 2;
      } else {
        this.form.address = scanResult;
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
            contractId: this.selectedToken.contract,
          }),
        },
      );
    },
    setTxDetails(tx) {
      if (tx.tx.type === 'ContractCallTx') {
        this.successTx.amount = convertToken(
          tx.amount,
          -this.availableTokens[tx.contractId].decimals,
        );
        this.successTx.token = tx.contractId;
        this.successTx.to = tx.recipientId;
        this.successTx.from = tx.callerId;
        this.successTx.hash = tx.hash;
        return;
      }
      this.successTx.amount = parseFloat(tx.tx.amount / 10 ** 18).toFixed(3);
      this.successTx.to = tx.tx.recipientId;
      this.successTx.from = tx.tx.senderId;
      this.successTx.hash = tx.hash;
    },
    async send() {
      const amount = !this.selectedToken
        ? aeToAettos(this.form.amount)
        : convertToken(this.form.amount, this.selectedToken.decimals);
      const receiver = this.form.address;
      if (this.account.address === await this.$store.dispatch('names/getAddress', receiver)) {
        await this.$store.dispatch('modals/open', {
          name: 'confirm',
          title: this.$t('pages.send.confirm-sending-to-same-account'),
        });
      }
      let errorModalMsg = '';
      if (receiver === '' || (!checkAddress(receiver) && !checkAensName(receiver))) {
        errorModalMsg = this.$t('modals.incorrect-address.msg');
      }
      if (this.form.amount <= 0) errorModalMsg = this.$t('modals.incorrect-amount.msg');
      if (
        this.selectedToken
          ? this.selectedToken.balance.comparedTo(this.form.amount) === -1
            || this.balance.comparedTo(this.fee) === -1
          : this.balance.comparedTo(this.fee.plus(this.form.amount)) === -1
      ) {
        errorModalMsg = this.$t('modals.insufficient-balance.msg');
      }
      if (errorModalMsg) {
        this.$store.dispatch('modals/open', { name: 'default', title: errorModalMsg, icon: 'critical' });
        return;
      }
      this.loading = true;
      try {
        if (this.selectedToken && this.invoiceId !== null) {
          const { hash } = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            this.form.amount,
            ZEIT_INVOICE_CONTRACT,
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
              contractId: this.selectedToken.contract,
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
              contractId: this.selectedToken.contract,
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

.transfer-send {
  .primary-title-darker {
    color: variables.$color-white;
  }

  .withdraw.step1 {
    .d-flex {
      display: flex;
      padding-bottom: 24px;

      &.error-below {
        padding-bottom: 0;
      }

      .textarea {
        width: 250px;
        min-height: 60px;
        margin: 0 20px 0 0;
        font-size: 11px;
      }
    }

    .error {
      padding-top: 8px;
      line-height: 16px;
      color: variables.$color-error;
      font-size: 12px;
      text-align: left;
    }

    .amount-input {
      margin-bottom: 24px;
    }

    small {
      color: variables.$color-green;
      display: block;
      width: 100%;
      padding-top: 5px;
      font-size: 12px;
    }
  }

  .withdraw.step2 {
    p {
      display: flex;
      justify-content: center;
      line-height: 2rem;
    }

    p:not(:first-of-type) {
      color: variables.$color-white;
    }

    p > svg {
      margin-right: 10px;
    }

    .info-group {
      .amount {
        font-size: 26px;
        color: variables.$color-blue;
      }

      .currencyamount {
        font-size: 18px;
        display: block;

        span {
          font-size: 18px;
        }
      }
    }

    .text-center {
      text-align: center;
    }
  }
}
</style>
