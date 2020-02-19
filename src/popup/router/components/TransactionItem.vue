<template>
  <div>
    <ae-list-item fill="neutral" class="list-item-transaction" :class="transactionData.hash">
      <div class="holder">
        <span class="amount"
          >{{ txAmount }} {{ $t('pages.appVUE.aeid') }} <span class="text">( {{ txAmountToCurrency }} {{ current.currency.toUpperCase() }} )</span></span
        >
        <span class="status">{{ txType == 'Sent' ? $t('pages.recentTransactions.sentStatus') : $t('pages.recentTransactions.receivedStatus') }}</span>
        <span class="time">{{ transactionDate }}</span>
      </div>
      <div class="holder">
        <span class="url" @click="visitTipUrl">{{ tipUrl }}</span>
        <span class="seeTransaction" @click="seeTx(transactionData.hash)"><Eye /></span>
      </div>
    </ae-list-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import Eye from '../../../icons/eye.svg';
import { convertToAE, formatDate } from '../../utils/helper';

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
      tipAmount: 0,
      tipComment: null,
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
    ...mapGetters(['account', 'popup', 'sdk', 'current', 'network', 'transactions', 'tipping']),
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
    transactionDate() {
      return formatDate(this.transactionData.time);
    },
  },
  methods: {
    async getEventData() {
      try {
        const { log } = await this.sdk.tx(this.transactionData.hash, true);
        this.tipUrl = decode(log[0].data).toString();
        this.tipAmount = convertToAE(log[0].topics[2]);
      } catch (e) {}
    },
    visitTipUrl() {
      if (this.tipUrl) {
        browser.tabs.create({ url: this.tipUrl, active: true });
      }
    },
    seeTx(txHash) {
      const txUrl = `${this.network[this.current.network].explorerUrl}/transactions/${txHash}`;
      browser.tabs.create({ url: txUrl, active: true });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.list-item-transaction:first-child {
  border-top: 1px solid $bg-color !important;
}
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
    font-size: 14px;
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
      color: $text-color !important;
      font-size: 12px;
      padding-top: 1px;
    }
    .date {
      color: $text-color !important;
      font-size: 12px;
      padding-top: 1px;
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
