<template>
  <div class="recent-transactions">
    <div class="flex flex flex-align-center flex-justify-between">
      <span class="title">{{ $t('pages.recentTransactions.recentActivity') }}</span>
      <span @click="allTransactions" class="viewAll">{{ $t('pages.recentTransactions.viewAll') }}</span>
    </div>

    <div v-if="newTip && !loading">
      <ae-list-item fill="neutral" class="list-item-transaction">
        <div class="holder">
          <span class="amount">
            {{ pendingTipo.amount }} æid <span style="color: #BCBCC4;">( {{ pendingTipo.amountCurrency }} {{ currentCurrency }} )</span>
          </span>
          <span class="status">{{ $t('pages.recentTransactions.pendingStatus') }}</span>
          <span class="time">{{ pendingTipo.time }}</span>
        </div>
        <div class="holder">
          <span class="url">{{ pendingTipo.domain }}</span>
          <span class="seeTransaction"><Eye /></span>
        </div>
      </ae-list-item>
    </div>
    <div v-if="transactions.latest.length && !loading">
      <ae-list class="transactionList">
        <TransactionItem :recent="true" :dark="true" v-for="transaction in transactions.latest" v-bind:key="transaction.id" :transactionData="transaction"></TransactionItem>
      </ae-list>
    </div>
    <div v-if="transactions.latest.length == 0 && !loading">
      <p class="paragraph noTransactions">{{ $t('pages.recentTransactions.noTransactionsFound') }}</p>
    </div>
    <div class="loader-holder">
      <Loader size="small" :loading="loading"></Loader>
    </div>

    <slot></slot>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval } from 'timers';
import BigNumber from 'bignumber.js';
import Eye from '../../../icons/eye.svg';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO, TIPPING_CONTRACT, toMicro } from '../../utils/constants';

export default {
  components: {
    Eye,
  },
  data() {
    return {
      polling: null,
      loading: true,
      newTip: false,
      pendingTipo: {
        amount: 0,
        domain: '',
        time: '',
        amountCurrency: 0,
      },
    };
  },
  created() {
    this.pollData();
  },
  computed: {
    ...mapGetters(['transactions', 'account', 'sdk', 'current', 'currentCurrency']),
  },
  allTransactions() {
    this.$router.push('/transactions');
  },
  methods: {
    async updateTransactions() {
      const transactions = await this.$store.dispatch('getTransactionsByPublicKey', { publicKey: this.account.publicKey, limit: 3 });
      this.loading = false;
      this.$store.dispatch('updateLatestTransactions', transactions);

      browser.storage.local.get('pendingTip').then(async res => {
        if (res.hasOwnProperty('pendingTip') && res.pendingTip) {
          this.newTip = true;
          if (this.newTip) {
            this.pendingTipo.amount = parseFloat(res.pendingTip.amount).toFixed(3);
            this.pendingTipo.domain = res.pendingTip.domain;
            this.pendingTipo.time = res.pendingTip.time;
            this.pendingTipo.amountCurrency = parseFloat(this.current.currencyRate ? this.pendingTipo.amount * this.current.currencyRate : this.pendingTipo.amount).toFixed(3);
          }
          const mined = await this.sdk.poll(res.pendingTip.hash);
          let transaction_ready = false;
          Object.keys(transactions).forEach(key => {
            if (mined && transactions[key].hash == res.pendingTip.hash) {
              transaction_ready = true;
            }
          });
          if (transaction_ready) {
            browser.storage.local.remove('pendingTip');
            this.newTip = false;
            return this.$router.push({
              name: 'success-tip',
              params: {
                amount: res.pendingTip.amount,
                domain: res.pendingTip.domain,
              },
            });
          }
        }
      });
    },
    pollData() {
      this.polling = setInterval(async () => {
        if (this.sdk != null) {
          this.updateTransactions();
        }
      }, 2500);
    },
    allTransactions() {
      this.$router.push('/transactions');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.recent-transactions {
  padding: 0 20px;
  padding-bottom: 20px;
  .title {
    color: $white-color !important;
  }
  .viewAll {
    color: $accent-color !important;
    cursor: pointer;
  }
}
.recent-transactions h3,
.recent-transactions p,
.recent-transactions .transactionList {
  color: #fff !important;
}
.all-transactions {
  height: auto !important;
  padding: 5px 10px !important;
  width: auto !important;
}
.list-item-transaction {
  display: inline-block !important;
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
      width: 295px;
      white-space: nowrap;
      overflow: hidden !important;
      text-overflow: ellipsis;
      color: #6a8ebe;
      font-size: 12px;
      text-align: left;
    }
    .seeTransaction {
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
  }
}
</style>
