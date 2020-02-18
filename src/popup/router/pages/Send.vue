<template>
  <div class="popup popup-no-padding">
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
          <Textarea v-model="form.address" placeholder="ak.. / name.chain" size="h-50"></Textarea>
          <div class="scan" @click="scan">
            <QrIcon />
            <small>{{ $t('pages.send.scan') }}</small>
          </div>
        </div>
        <AmountSend @changeAmount="val => (form.amount = val)" :value="form.amount" />
        <div class="flex flex-align-center flex-justify-between">
          <Button half @click="navigateAccount">{{ $t('pages.send.cancel') }}</Button>
          <Button half @click="step = 2" :disabled="!form.address || !form.amount || (form.amount && isNaN(form.amount))">{{ $t('pages.send.review') }}</Button>
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
        <div class="info-group">
          <label class="info-label">{{ $t('pages.send.sendingAddress') }}</label>
          <span class="info-span">{{ account.publicKey }}</span>
        </div>
        <div class="info-group">
          <label class="info-label">{{ $t('pages.send.receivingAddress') }}</label>
          <span class="info-span">{{ form.address }}</span>
        </div>
        <div class="info-group">
          <label>{{ $t('pages.send.amount') }}</label>
          <div class="text-center">
            <span class="amount">{{ toFixedAmount }} {{ $t('pages.appVUE.aeid') }}</span>
            <span class="currencyamount">
              ~
              <span>{{ amountConvert }} {{ current.currency.toUpperCase() }}</span>
            </span>
          </div>
        </div>
        <Button @click="step = 1" extend>{{ $t('pages.send.editTxDetails') }}</Button>
        <div class="flex flex-align-center flex-justify-between">
          <Button half @click="navigateAccount">{{ $t('pages.send.cancel') }}</Button>
          <Button half @click="send" :disabled="sdk ? false : true">{{ $t('pages.send.send') }}</Button>
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
          <span class="secondary-text ml-5"> {{ successTx.amount }} {{ $t('pages.appVUE.aeid') }}</span>
        </p>
        <div class="info-group">
          <label class="info-label">{{ $t('pages.send.to') }}</label>
          <span class="info-span">{{ successTx.to }}</span>
        </div>
        <div class="info-group">
          <label class="info-label">{{ $t('pages.send.from') }}</label>
          <span class="info-span">{{ successTx.from }}</span>
        </div>
        <div class="info-group">
          <label class="info-label">{{ $t('pages.send.txhash') }}</label>
          <span class="info-span">{{ successTx.hash }}</span>
        </div>
        <Button @click="navigateAccount">{{ $t('pages.send.home') }}</Button>
      </div>
    </div>
    <Loader size="big" :loading="loading" type="transparent"></Loader>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { MAGNITUDE, calculateFee, TX_TYPES } from '../../utils/constants';
import { contractEncodeCall, checkAddress, chekAensName, setPendingTx } from '../../utils/helper';
import AmountSend from '../components/AmountSend';
import Textarea from '../components/Textarea';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import QrIcon from '../../../icons/qr-code.svg';
import AlertExclamination from '../../../icons/alert-exclamation.svg';
import Heart from '../../../icons/heart.svg';

export default {
  name: 'Send',
  components: {
    AmountSend,
    Textarea,
    AccountInfo,
    BalanceInfo,
    QrIcon,
    AlertExclamination,
    Heart,
  },
  data() {
    return {
      step: 1,
      ae_token: browser.runtime.getURL('../../../icons/ae.png'),
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
    activeToken() {
      this.fetchFee();
    },
  },
  computed: {
    ...mapGetters([
      'account',
      'balance',
      'network',
      'current',
      'wallet',
      'activeAccount',
      'subaccounts',
      'tokenSymbol',
      'tokenBalance',
      'sdk',
      'tokens',
      'popup',
      'activeAccountName',
    ]),
    amountConvert() {
      return (this.form.amount * this.current.currencyRate).toFixed(3);
    },
    toFixedAmount() {
      return parseFloat(this.form.amount).toFixed(3);
    },
    maxValue() {
      const calculatedMaxValue = this.balance - this.maxFee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    sendSubaccounts() {
      const subs = this.subaccounts.filter(sub => sub.publicKey != this.account.publicKey);
      return subs.length == 0 ? false : subs;
    },
    txFee() {
      return this.fee.min;
    },
    maxFee() {
      return this.fee.max;
    },
    activeToken() {
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
    this.init();
    this.fetchFee();
  },
  methods: {
    scan() {
      this.$router.push({
        name: 'qrCodeReader',
        params: {
          type: 'send',
        },
      });
    },
    async fetchFee() {
      const fee = await calculateFee(this.current.token == 0 ? TX_TYPES.txSign : TX_TYPES.contractCall, { ...(await this.feeParams()) });
      this.fee = fee;
    },
    async feeParams() {
      if (this.current.token == 0) {
        return {
          ...this.sdk.Ae.defaults,
        };
      }
      return {
        ...this.sdk.Ae.defaults,
        callerId: this.account.publicKey,
        contractId: this.tokens[this.current.token].contract,
        callData: await contractEncodeCall(this.sdk, FUNGIBLE_TOKEN_CONTRACT, 'transfer', [this.account.publicKey, '0']),
      };
    },
    setTxDetails(tx) {
      this.successTx.amount = parseFloat(tx.tx.amount / 10 ** 18).toFixed(3);
      this.successTx.to = tx.tx.recipientId;
      this.successTx.from = tx.tx.senderId;
      this.successTx.hash = tx.hash;
    },
    async send() {
      const sender = this.subaccounts.filter(sender => sender.publicKey == this.account.publicKey);
      const amount = BigNumber(this.form.amount).shiftedBy(MAGNITUDE);
      const receiver = this.form.address;
      if (receiver == '' || (!checkAddress(receiver) && !chekAensName(receiver))) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address' });
        this.loading = false;
        return;
      }
      if (this.form.amount <= 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_amount' });
        this.loading = false;
        return;
      }
      if (this.tokenSymbol != 'æid' && this.form.amount % 1 != 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'integer_required' });
        this.loading = false;
        return;
      }
      if (this.maxValue - this.form.amount <= 0 && this.current.token == 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const result = await this.sdk.spend(parseInt(amount), receiver, { waitMined: false });
        if (result.hash) {
          await setPendingTx({ hash: result.hash, amount: this.form.amount, time: Date.parse(new Date()), type: 'spend' });
          return this.$router.push('/account');
        }
        this.loading = false;
      } catch (e) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
        this.loading = false;
      }
    },
    init() {
      const calculatedMaxValue = this.balance - this.maxFee;
    },
    clearForm() {
      setTimeout(() => {
        this.loading = false;
        this.form.address = '';
        this.form.amount = '';
      }, 2000);
    },
    navigateAccount() {
      this.$router.push('/account');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.d-flex {
  display: flex;
}
.withdraw.step1 {
  textarea {
    width: 250px;
    min-height: 60px !important;
    margin: 0 20px 0px 0px;
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
    text-align: left;
    display: block;
    margin: 20px 0px;
    .info-label {
      display: block;
      padding: 10px 0;
    }
    .info-span {
      color: $accent-color;
      font-size: 11px;
      display: inline-block;
      width: 300px;
      white-space: nowrap;
      // overflow: hidden !important;
      // text-overflow: ellipsis;
      letter-spacing: -0.3px;
    }
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
