<template>
  <div>
    <ae-list-item fill="neutral" class="list-item-transaction" :class="transactionData.hash">
      <div class="holder">
        <span class="amount"
          >{{ txAmount }} æid <span style="color: #BCBCC4;">( {{ txAmountToCurrency }} {{ current.currency.toUpperCase() }} )</span></span
        >
        <span class="status">{{ txType }}</span>
        <span class="time">{{ transactionData.time ? new Date(transactionData.time).toLocaleTimeString() : '-- -- --' }}</span>
      </div>
      <div class="holder">
        <span class="url" @click="visitTipUrl">{{ tipUrl }}</span>
        <span class="seeTransaction" :class="!tipTx ? 'invisible' : ''" @click="seeTx"><Eye /></span>
      </div>
    </ae-list-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import Eye from '../../../icons/eye.svg';
import { convertToAE } from '../../utils/helper';

export default {
  props: ['transactionData', 'recent', 'dark'],
  components: {
    Eye,
  },
  data() {
    return {
      status: '',
      tipUrl: null,
      checkSdk: null,
      tipTx: true,
      tipAmount: 0,
    };
  },
  async created() {
    this.checkSdk = setInterval(() => {
      if (this.sdk !== null) {
        this.getEventData();
        clearInterval(this.checkSdk);
      }
    }, 100);
  },
  computed: {
    ...mapGetters(['account', 'popup', 'sdk', 'current']),
    balanceSign() {
      return this.transactionData.tx.sender_id == this.account.publicKey || this.transactionData.tx.account_id == this.account.publicKey ? 'minus' : 'plus';
    },
    txType() {
      if (
        this.transactionData.tx.sender_id == this.account.publicKey ||
        this.transactionData.tx.account_id == this.account.publicKey ||
        this.transactionData.tx.owner_id == this.account.publicKey ||
        this.transactionData.tx.caller_id == this.account.publicKey
      ) {
        return 'Sent';
      }
      return 'Received';
    },
    transactionType() {
      if (this.transactionData.tx.type == 'SpendTx') {
        if (this.transactionData.tx.sender_id == this.account.publicKey) {
          return { fill: 'primary', type: 'Spend Tx Out' };
        }
        return { fill: 'alternative', type: 'Spend Tx In' };
      }
      if (this.transactionData.tx.type == 'ContractCreateTx') {
        return { fill: 'secondary', type: 'Contract Create Tx ' };
      }
      if (this.transactionData.tx.type == 'NamePreclaimTx' || this.transactionData.tx.type == 'NameUpdateTx' || this.transactionData.tx.type == 'NameClaimTx') {
        return { fill: '', type: this.transactionData.tx.type };
      }
      if (this.transactionData.tx.type == 'ContractCallTx') {
        return { fill: 'secondary', type: 'Contract Call Tx' };
      }

      return { fill: '', type: this.transactionData.tx.type };
    },
    transactionAccount() {
      if (this.transactionData.tx.type == 'SpendTx') {
        return this.transactionData.tx.sender_id;
      }
      if (this.transactionData.tx.type == 'ContractCreateTx') {
        return this.transactionData.tx.owner_id;
      }
      if (this.transactionData.tx.type == 'ContractCallTx') {
        return this.transactionData.tx.caller_id;
      }

      return typeof this.transactionData.tx.account_id !== 'undefined' ? this.transactionData.tx.account_id : '';
    },
    txAmount() {
      const amount = this.transactionData.tx.amount ? this.transactionData.tx.amount : 0;
      // const { fee } = this.transactionData.tx;
      return convertToAE(amount).toFixed(3);
    },
    txAmountToCurrency() {
      const amount = this.transactionData.tx.amount ? this.transactionData.tx.amount : 0;
      const { fee } = this.transactionData.tx;
      const txamount = (amount + fee) / 10 ** 18;
      return (txamount * this.current.currencyRate).toFixed(3);
    },
  },
  methods: {
    showTransactionDetails() {
      this.$router.push({ name: 'transaction-details', params: { transaction: this.transactionData } });
    },
    showTransaction() {
      browser.tabs.create({ url: this.popup.data, active: false });
    },
    async getEventData() {
      try {
        const { log } = await this.sdk.tx(this.transactionData.hash, true);
        this.tipUrl = decode(log[0].data).toString();
        this.tipAmount = convertToAE(log[0].topics[2]);
      } catch (e) {
        this.tipTx = false;
      }
    },
    visitTipUrl() {
      if(this.tipUrl) {
        browser.tabs.create({ url: this.tipUrl, active: true });
      }
    },
    seeTx() {
      browser.tabs.create({ url: 'https://coronanews.org/#/', active: true });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.list-item-transaction {
  display: inline-block;
  padding: 5px 0;
  border-color: $bg-color !important;
  text-decoration: none;
  list-style: none;
  cursor: default;
  border-top: 1px solid transparent;

  .holder {
    display: flex;
    justify-content: space-between;
    .url {
      display: inline-block;
      width: 284px;
      white-space: nowrap;
      overflow: hidden !important;
      text-overflow: ellipsis;
      color: $accent-color;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
    }
    .seeTransaction {
      margin-left: 10px;
    }
    .time {
      color: #cbcbcb !important;
      font-size: 12px;
    }
    .amount {
      color: $secondary-color !important;
      font-size: 14px;
    }
    .status {
      color: $text-color !important;
    }
    .invisible {
      visibility: hidden;
    }
  }
}
</style>
