<template>
  <div>
    <ae-list-item fill="neutral" class="list-item-transaction" :class="transactionData.hash">
      <div class="holder">
        <span class="amount">{{ txAmount }} æid ( <span style="color: #BCBCC4;">{{ txAmountToUSD }} USD</span> )</span>
        <span class="status">{{ status }}</span>
        <span class="time">{{ new Date(transactionData.time).toLocaleTimeString() }}</span>
      </div>
      <div class="holder">
        <span class="url">https://facebook.com/JohnDoe/post/something/someofthchanges/wallet/notwallet/facebookgiven</span>
        <span class="seeTransaction"><Eye /></span>
      </div>
      <!-- <ae-identicon style="width: 10%;" :address="transactionAccount" />
      <div class="transaction-address">
        <ae-address :value="transactionAccount" length="short" :class="dark ? 'dark' : ''" v-if="transactionAccount != ''" />
        <ae-text face="mono-xs" class="transactionDate">{{ new Date(transactionData.time).toLocaleTimeString() }}</ae-text>
      </div>
      <div class="text-right balance-change" :class="recent ? 'mr-0' : ''">
        <div class="balance" :class="dark ? 'dark' : ''">{{ txAmount }}</div>
      </div> -->
    </ae-list-item>
    <!-- <popup :popupSecondBtnClick="popup.secondBtnClick"></popup> -->
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Eye from '../../../icons/eye.svg';

export default {
  props: ['transactionData', 'recent', 'dark'],
  components: {
    Eye
  },
  data() {
    return {
      status: '',
      rateUsd: null
    };
  },
  async created() {
    if (this.transactionData.tx.recipient_id == this.account.publicKey) {
      this.status = 'Received'
    } else if (this.transactionData.tx.caller_id == this.account.publicKey) {
      this.status = 'Sent'
    }
    
    await browser.storage.local.get('rateUsd').then(res => {
      this.rateUsd = res.rateUsd;
    });
  },
  computed: {
    ...mapGetters(['account', 'popup']),
    balanceSign() {
      return this.transactionData.tx.sender_id == this.account.publicKey || this.transactionData.tx.account_id == this.account.publicKey ? 'minus' : 'plus';
    },
    transactionTypeClass() {
      return `transaction${
        this.transactionData.tx.sender_id == this.account.publicKey ||
        this.transactionData.tx.account_id == this.account.publicKey ||
        this.transactionData.tx.owner_id == this.account.publicKey
          ? 'Outgoing'
          : 'Incoming'
      }`;
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
      const { fee } = this.transactionData.tx;
      return ((amount + fee) / 10 ** 18).toFixed(3);
    },
    txAmountToUSD() {
      const amount = this.transactionData.tx.amount ? this.transactionData.tx.amount : 0;
      const { fee } = this.transactionData.tx;
      let txamount = (amount + fee) / 10 ** 18;
      return (txamount * this.rateUsd).toFixed(3);
    },
  },
  methods: {
    showTransactionDetails() {
      this.$router.push({ name: 'transaction-details', params: { transaction: this.transactionData } });
    },
    showTransaction() {
      browser.tabs.create({ url: this.popup.data, active: false });
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
      width: 294px;
      white-space: nowrap;
      overflow: hidden !important;
      text-overflow: ellipsis;
      color: $accent-color;
      font-size: 12px
    }
    .seeTransaction {

    }
    .time {
      color: #CBCBCB !important;
      font-size: 12px;
    }
    .amount {
      color: $secondary-color !important;
      font-size: 14px;
    }
    .status {
      color: $text-color !important;
    }
  }
}
</style>
