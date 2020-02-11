<template>
  <div>
    <div v-if="step == 1">
      <AccountInfo />
      <BalanceInfo />
      <div class="popup withdraw step1">
        <p class="primary-title text-left mb-8 f-16">
          {{ $t('pages.tipPage.heading') }}
          <span
            class="secondary-text"
          >{{ $t('pages.appVUE.aeid') }}</span>
          {{ $t('pages.tipPage.to') }}
        </p>
        <div class="d-flex">
          <Textarea v-model="form.address" placeholder="ak.. / name.test" size="h-50"></Textarea>
          <div class="scan" @click="scan">
            <QrIcon />
            <small>{{ $t('pages.send.scan') }}</small>
          </div>
        </div>
        <AmountSend @changeAmount="val => (form.amount = val)" :value="form.amount" />
        <div class="button-group">
          <Button @click="navigateAccount">{{ $t('pages.send.cancel') }}</Button>
          <Button @click="step = 2" :disabled="!form.address || !form.amount">{{ $t('pages.send.review') }}</Button>
        </div>
      </div>
    </div>
    <div v-if="step == 2">
      <div class="popup withdraw step2">
        <p>
          <AlertExclamination />{{ $t('pages.send.reviewtx') }}
        </p>
        <p>{{ $t('pages.send.checkalert') }}</p>
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
            <span class="amount">{{ toFixedAmount }} {{ tokenSymbol }}</span>
            <span class="currencyamount">
              ~
              <span>{{ amountConvert }} {{ (current.currency).toUpperCase() }}</span>
            </span>
          </div>
        </div>
        <Button @click="step = 1">{{ $t('pages.send.editTxDetails') }}</Button>
        <div class="button-group">
          <Button @click="navigateAccount">{{ $t('pages.send.cancel') }}</Button>
          <Button @click="send">{{ $t('pages.send.send') }}</Button>
        </div>
      </div>
    </div>
    <div v-if="step == 3">
      <div class="popup withdraw step2">
        <p>
          <Heart /> {{ $t('pages.send.tx-success') }}
        </p>
        <p>{{ $t('pages.send.successalert') }} <span style="color:#FF4784"> {{ successTx.amount }} {{tokenSymbol}}</span></p>
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
import { generateSignRequestUrl } from '../../utils/airGap';
import { contractEncodeCall, checkAddress, chekAensName } from '../../utils/helper';
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
    Heart
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
      tx: {
        status: false,
        hash: '',
        block: '',
        url: '',
      },
      fee: {
        min: 0,
        max: 0,
      },
      not_correct: false,
      successTx: {
        amount: '',
        from: '',
        to: '',
        hash: ''
      }
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
      return parseFloat((this.form.amount)).toFixed(3);
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
      this.successTx.amount = ( parseFloat((this.successtx.tx.amount) / 10 ** 18) ).toFixed(3);
      this.successTx.to = this.successtx.tx.recipientId;
      this.successTx.from = this.successtx.tx.senderId;
      this.successTx.hash = this.successtx.hash;
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
    setActiveToken(token) {
      this.current.token = token;
      this.$store.commit('RESET_TRANSACTIONS', []);
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
    send() {
      const sender = this.subaccounts.filter(sender => sender.publicKey == this.account.publicKey);
      const isAirGapAcc = sender[0].isAirGapAcc == true && sender[0].isAirGapAcc != undefined;
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
      if (this.current.token != 0) {
        if (this.maxValue - this.txFee <= 0) {
          this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
          this.loading = false;
          return;
        }
        if (this.tokenBalance - this.form.amount <= 0) {
          this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
          this.loading = false;
          return;
        }
        const tx = {
          popup: false,
          tx: {
            source: FUNGIBLE_TOKEN_CONTRACT,
            method: 'transfer',
            params: [receiver, parseFloat(this.form.amount)],
            address: this.tokens[this.current.token].contract,
            amount: parseFloat(this.form.amount),
            token: this.tokenSymbol,
          },
          type: 'contractCall',
        };
        this.$store.commit('SET_AEPP_POPUP', true);
        this.$router.push({
          name: 'sign',
          params: {
            data: tx,
          },
        });
        return;
      }
      if (isAirGapAcc) {
        browser.storage.local.get('airGapGeneratedKey').then(async publicKHex => {
          const spendTx = await this.sdk.spendTx({ senderId: this.account.publicKey, recipientId: receiver, amount });
          const generated = generateSignRequestUrl(this.network[this.current.network].networkId, spendTx, publicKHex.airGapGeneratedKey);
          this.$router.push({ name: 'signTransactionByQrCode', params: { url: generated } });
        });
        return;
      }
      const tx = {
        popup: false,
        tx: {
          amount: this.form.amount,
          recipientId: receiver,
        },
        type: 'txSign',
      };
      this.$store.commit('SET_AEPP_POPUP', true);
      this.$router.push({
        name: 'sign',
        params: {
          data: tx,
        },
      });
    },
    init() {
      const calculatedMaxValue = this.balance - this.maxFee;
    },
    clearForm() {
      setTimeout(() => {
        this.loading = false;
        this.tx.status = false;
        this.form.address = '';
        this.form.amount = '';
      }, 2000);
    },
    navigateAccount() {
      this.$router.push('/account');
    },
    openExplorer(url) {
      browser.tabs.create({ url, active: false });
    },
    selectSendSubaccount(account) {
      this.form.address = account.publicKey;
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
      overflow: hidden !important;
      text-overflow: ellipsis;
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

.sendContent > div:not(.sendAmount):not(.address) {
  margin-bottom: 10px;
}
.sendContent > div {
  overflow: unset;
}
.balanceInfo {
  margin-top: 10px;
}
.token-symbol {
  margin-right: 2rem;
}
.ae-dropdown-button {
  width: 16px !important;
  height: 16px !important;
}
.sendContent .ae-dropdown {
  margin-bottom: 0 !important;
}
.ae-input-container .ae-input-box {
  background: #fff !important;
  border: solid 2px #dcdcdc;
  border-radius: 10px;
}
.address {
  position: relative;
}
.address:focus-within {
  border-left: #ff0d6a 2px solid;
}
.address:focus-within {
  p:not(.ae-text) {
    color: #ff0d6a;
  }
  p:after:not(.ae-text) {
    content: '*';
    color: #ff0d6a;
  }
}
.address textarea {
  background: none;
  border: none;
  font-size: 20px;
  outline: none;
  text-align: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.0625rem;
  line-height: 1.5rem;
  font-weight: bold;
}
.address p:not(.ae-text) {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 11px;
  color: #76818c;
  font-weight: 100;
  width: 100%;
  text-align: left;
  padding-left: 15px;
  background: #ececec;
}
.sendSubaccount .ae-list-item {
  cursor: pointer !important;
}
.paste {
  cursor: pointer;
  .ae-icon {
    margin-right: 2px;
    display: inline-block;
  }
}
.send-account-icon {
  margin: 0 5px;
  transform: translateY(5px);
  -ms-transform: translateY(5px);
  -webkit-transform: translateY(5px);
}
.button-group {
  display: flex;
  button {
    margin: 5px;
    width: 50% !important;
  }
}
</style>
