<template>
  <div class="popup">
    <h3 class="">
      {{ $t('pages.send.heading') }}
      <ae-identicon class="send-account-icon" :address="account.publicKey" size="s" />
      {{ activeAccountName }}
    </h3>
    <div class="sendContent">
      <AmountSend @changeAmount="val => (form.amount = val)" :value="form.amount" />
      <Textarea v-model="form.address" placeholder="ak.. / name.test" size="sm"> </Textarea>
      <div>
        <p v-if="sendSubaccounts">{{ $t('pages.send.sendSubaccount') }}</p>
        <ae-list class="sendSubaccount">
          <ae-list-item v-for="(account, index) in sendSubaccounts" @click="selectSendSubaccount(account)" fill="neutral" :key="index" class=" flex-align-center">
            <ae-identicon class="subAccountIcon" v-bind:address="account.publicKey" size="base" />
            <div class="subAccountInfo flex flex-align-start flex-direction-column ">
              <div class="subAccountName">{{ account.name }}</div>
              <div class="subAccountBalance">{{ account.balance }} æid</div>
            </div>
          </ae-list-item>
        </ae-list>
      </div>
      <div>
        <Button @click="send">
          {{ $t('pages.send.send') }}
        </Button>
      </div>
    </div>
    <input type="hidden" class="txHash" :value="tx.hash" />
    <div class="result" v-if="tx.status">
      <p>{{ $t('pages.send.success') }}</p>
      <a :href="tx.url">{{ $t('pages.send.seeTransactionExplorer') }}</a>
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

export default {
  name: 'Send',
  components: {
    AmountSend,
    Textarea,
  },
  data() {
    return {
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
    };
  },
  props: ['address'],
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
    myTokens() {
      return this.tokens.filter((t, index) => {
        if (t.parent == this.account.publicKey || t.symbol == 'æid') {
          t.key = index;
          return t;
        }
      });
    },
  },
  created() {
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
</style>
