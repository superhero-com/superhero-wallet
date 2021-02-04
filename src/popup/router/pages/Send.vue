<template>
  <div class="popup popup-no-padding">
    <div data-cy="send-container">
      <div v-if="step == 1">
        <AccountInfo />
        <BalanceInfo />
        <div class="popup withdraw step1">
          <p class="primary-title text-left mb-8 f-16">
            {{ $t('pages.tipPage.heading') }}
            <span class="secondary-text">{{
              selectedToken ? selectedToken.symbol : $t('ae')
            }}</span>
            {{ $t('pages.tipPage.to') }}
          </p>
          <div :class="['d-flex', { 'error-below': form.address.length > 0 && !validAddress }]">
            <Textarea
              :type="address"
              data-cy="address"
              :error="form.address.length > 0 && !validAddress"
              v-model.trim="form.address"
              placeholder="ak.. / name.chain"
              size="h-50"
            />
            <div class="scan" data-cy="scan-button" @click="scan">
              <QrIcon />
              <small>{{ $t('pages.send.scan') }}</small>
            </div>
          </div>
          <div class="error" v-show="form.address.length > 0 && !validAddress">
            {{ $t('pages.send.error') }}
          </div>
          <AmountSend
            data-cy="amount-box"
            v-model="form.amount"
            :amountError="form.amount.length > 0 && form.amount <= 0"
          />
          <div class="flex flex-align-center flex-justify-between">
            <Button data-cy="reject-withdraw" half @click="$router.push('/account')">{{
              $t('pages.send.cancel')
            }}</Button>
            <Button
              data-cy="review-withdraw"
              half
              @click="step = 2"
              :disabled="!validAddress || !+form.amount || form.amount <= 0"
              >{{ $t('pages.send.review') }}</Button
            >
          </div>
        </div>
      </div>
      <div v-if="step == 2">
        <div class="popup withdraw step2">
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
            :value="account.publicKey"
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
              <span data-cy="review-amount" class="amount"
                >{{ parseFloat(form.amount).toFixed(3) }}
                {{ selectedToken ? selectedToken.symbol : $t('ae') }}</span
              >
              <span v-if="!selectedToken" class="currencyamount">
                <!--eslint-disable-line vue-i18n/no-raw-text-->
                ~
                <span>
                  {{ formatCurrency((form.amount * currentCurrencyRate).toFixed(3)) }}
                </span>
              </span>
            </div>
          </InfoGroup>
          <Button data-cy="reivew-editTxDetails-button" @click="step = 1" extend>{{
            $t('pages.send.editTxDetails')
          }}</Button>
          <div class="flex flex-align-center flex-justify-between">
            <Button data-cy="review-cancel-button" half @click="$router.push('/account')">{{
              $t('pages.send.cancel')
            }}</Button>
            <Button
              data-cy="review-send-button"
              half
              @click="send"
              :disabled="sdk ? false : true"
              >{{ $t('pages.send.send') }}</Button
            >
          </div>
        </div>
      </div>
      <div v-if="step == 3">
        <div class="popup withdraw step2">
          <h3 class="heading-1 my-15 center">
            <div class="flex flex-align-center flex-justify-content-center">
              <span class="ml-7">{{ $t('pages.send.tx-success') }}</span>
            </div>
          </h3>
          <p class="primary-title primary-title-darker text-left my-5 f-16">
            <span>{{ $t('pages.send.successalert') }}</span>
            <span class="secondary-text ml-5">
              {{ successTx.amount }}
              {{ successTx.token ? availableTokens[successTx.token].symbol : $t('ae') }}</span
            >
          </p>
          <InfoGroup :value="successTx.to" :label="$t('pages.send.to')" />
          <InfoGroup :value="successTx.from" :label="$t('pages.send.from')" />
          <InfoGroup :value="successTx.hash" :label="$t('pages.send.hash')" />
          <Button @click="$router.push('/account')">{{ $t('pages.send.home') }}</Button>
        </div>
      </div>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import { calculateFee, TX_TYPES } from '../../utils/constants';
import { checkAddress, chekAensName, aeToAettos, convertToken } from '../../utils/helper';
import AmountSend from '../components/AmountSend';
import InfoGroup from '../components/InfoGroup';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import QrIcon from '../../../icons/qr-code.svg?vue-component';
import AlertExclamination from '../../../icons/alert-exclamation.svg?vue-component';

export default {
  name: 'Send',
  components: {
    AmountSend,
    Textarea,
    Button,
    AccountInfo,
    BalanceInfo,
    QrIcon,
    AlertExclamination,
    InfoGroup,
  },
  data() {
    return {
      step: 1,
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
  props: ['address', 'redirectstep', 'successtx'],
  watch: {
    selectedToken() {
      this.fetchFee();
    },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapState('fungibleTokens', ['selectedToken', 'availableTokens']),
    ...mapState(['current', 'sdk']),
    ...mapGetters(['account', 'formatCurrency', 'currentCurrencyRate']),
    validAddress() {
      return checkAddress(this.form.address) || chekAensName(this.form.address);
    },
  },
  created() {
    if (this.redirectstep && this.successtx) {
      this.step = 3;
      this.setTxDetails(this.successtx);
    }
    if (typeof this.address !== 'undefined') {
      this.form.address = this.address;
    }
  },
  async mounted() {
    this.fetchFee();
  },
  methods: {
    async scan() {
      this.form.address = await this.$store.dispatch('modals/open', {
        name: 'read-qr-code',
        title: this.$t('pages.send.scanAddress'),
      });
      if (!this.form.address) this.form.address = '';
    },
    async fetchFee() {
      await this.$watchUntilTruly(() => this.sdk);
      this.fee = calculateFee(!this.selectedToken ? TX_TYPES.txSign : TX_TYPES.contractCall, {
        ...this.sdk.Ae.defaults,
        ...(this.selectedToken && {
          callerId: this.account.publicKey,
          contractId: this.selectedToken.contract,
        }),
      });
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
      let errorModalType = '';
      if (receiver === '' || (!checkAddress(receiver) && !chekAensName(receiver))) {
        errorModalType = 'incorrect-address';
      }
      if (this.form.amount <= 0) errorModalType = 'incorrect-amount';
      if (
        this.selectedToken
          ? this.selectedToken.balance.comparedTo(this.form.amount) === -1 ||
            this.balance.comparedTo(this.fee) === -1
          : this.balance.comparedTo(this.fee.plus(this.form.amount)) === -1
      ) {
        errorModalType = 'insufficient-balance';
      }
      if (errorModalType) {
        this.$store.dispatch('modals/open', { name: 'default', type: errorModalType });
        return;
      }
      this.loading = true;
      try {
        if (this.selectedToken) {
          const { hash } = await this.$store.dispatch('fungibleTokens/transfer', [
            receiver,
            this.form.amount,
            { waitMined: true, modal: false },
          ]);
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spendToken',
            recipientId: receiver,
          });
          await this.$store.dispatch('fungibleTokens/getAvailableTokens');
          await this.$store.dispatch('fungibleTokens/loadTokenBalances', this.account.publicKey);
          await this.$store.dispatch('cacheInvalidateFT', this.selectedToken.contract);
        } else {
          const { hash } = await this.sdk.spend(amount, receiver, {
            waitMined: false,
            modal: false,
          });
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spend',
          });
        }
        this.$router.push('/account');
      } catch (e) {
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
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

.primary-title-darker {
  color: $text-color;
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
    color: #ff4746;
    font-size: 12px;
    text-align: left;
  }

  small {
    color: $accent-color;
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
    color: $text-color;
  }

  p > svg {
    margin-right: 10px;
  }

  .info-group {
    .amount {
      font-size: 26px;
      color: $secondary-color;
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
</style>
