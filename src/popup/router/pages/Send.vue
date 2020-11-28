<template>
  <div class="popup popup-no-padding">
    <div data-cy="send-container">
      <div v-if="step == 1">
        <AccountInfo />
        <BalanceInfo />
        <div class="popup withdraw step1">
          <p class="primary-title text-left mb-8 f-16">
            {{ $t('pages.tipPage.heading') }}
            <span class="secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
            {{ $t('pages.tipPage.to') }}
          </p>
          <div class="d-flex">
            <Textarea
              :type="address"
              data-cy="address"
              :error="form.address && !validAddress"
              v-model.trim="form.address"
              placeholder="ak.. / name.chain"
              size="h-50"
            />
            <div class="scan" data-cy="scan-button" @click="scan">
              <QrIcon />
              <small>{{ $t('pages.send.scan') }}</small>
            </div>
          </div>
          <AmountSend data-cy="amount-box" v-model="form.amount" :amountError="form.amount <= 0" />
          <div class="flex flex-align-center flex-justify-between">
            <Button data-cy="reject-withdraw" half @click="$router.push('/account')">{{
              $t('pages.send.cancel')
            }}</Button>
            <Button
              data-cy="review-withdraw"
              half
              @click="step = 2"
              :disabled="!form.address || !+form.amount || form.amount <= 0"
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
              <span data-cy="review-amount" class="amount">
                {{ parseFloat(form.amount).toFixed(3) }} {{ $t('pages.appVUE.aeid') }}
              </span>
              <span class="currencyamount">
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
              <Heart />
              <span class="ml-7">{{ $t('pages.send.tx-success') }}</span>
            </div>
          </h3>
          <p class="primary-title primary-title-darker text-left my-5 f-16">
            <span>{{ $t('pages.send.successalert') }}</span>
            <span class="secondary-text ml-5">
              {{ successTx.amount }} {{ $t('pages.appVUE.aeid') }}</span
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
import { mapGetters, mapState } from 'vuex';
import { calculateFee, TX_TYPES } from '../../utils/constants';
import { checkAddress, chekAensName, aeToAettos } from '../../utils/helper';
import AmountSend from '../components/AmountSend';
import InfoGroup from '../components/InfoGroup';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import QrIcon from '../../../icons/qr-code.svg?vue-component';
import AlertExclamination from '../../../icons/alert-exclamation.svg?vue-component';
import Heart from '../../../icons/heart.svg?vue-component';

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
    Heart,
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
      fee: {
        min: 0,
        max: 0,
      },
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
    token() {
      this.fetchFee();
    },
  },
  computed: {
    ...mapState(['balance', 'current', 'sdk']),
    ...mapGetters(['account', 'formatCurrency', 'currentCurrencyRate']),
    validAddress() {
      return checkAddress(this.form.address) || chekAensName(this.form.address);
    },
    token() {
      return this.current.token;
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
    },
    async fetchFee() {
      await this.$watchUntilTruly(() => this.sdk);
      this.fee = await calculateFee(
        this.token === 0 ? TX_TYPES.txSign : TX_TYPES.contractCall,
        this.sdk.Ae.defaults,
      );
    },
    setTxDetails(tx) {
      this.successTx.amount = parseFloat(tx.tx.amount / 10 ** 18).toFixed(3);
      this.successTx.to = tx.tx.recipientId;
      this.successTx.from = tx.tx.senderId;
      this.successTx.hash = tx.hash;
    },
    async send() {
      const amount = aeToAettos(this.form.amount);
      const receiver = this.form.address;
      const calculatedMaxValue = this.balance > this.fee.max ? this.balance - this.fee.max : 0;
      let errorModalType = '';
      if (receiver === '' || (!checkAddress(receiver) && !chekAensName(receiver))) {
        errorModalType = 'incorrect-address';
      }
      if (this.form.amount <= 0) errorModalType = 'incorrect-amount';
      if (calculatedMaxValue - this.form.amount <= 0 && this.token === 0) {
        errorModalType = 'insufficient-balance';
      }
      if (errorModalType) {
        this.$store.dispatch('modals/open', { name: 'default', type: errorModalType });
        return;
      }
      this.loading = true;
      try {
        const { hash } = await this.sdk.spend(amount, receiver, { waitMined: false, modal: false });
        if (hash) {
          this.$store.commit('addPendingTransaction', {
            hash,
            amount,
            type: 'spend',
          });
          this.$router.push('/account');
        }
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

.d-flex {
  display: flex;
}

.withdraw.step1 {
  textarea {
    width: 250px;
    min-height: 60px !important;
    margin: 0 20px 0 0;
    font-size: 11px;
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
