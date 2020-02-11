<template>
  <div class="recent-transactions">
    <div class="flex flex flex-align-center flex-justify-between">
      <span class="title">{{ $t('pages.recentTransactions.recentActivity') }}</span>
      <span @click="allTransactions" class="viewAll">{{ $t('pages.recentTransactions.viewAll') }}</span>
    </div>

    <div v-if="newTip && !loading">
      <ae-list-item v-for="tr in pendingTipoArr" v-bind:key="tr.id" fill="neutral" class="list-item-transaction">
        <div class="holder">
          <span class="amount">
            {{ tr.amount }} æid <span style="color: #BCBCC4;">( {{ tr.amountCurrency }} {{ currentCurrency }} )</span>
          </span>
          <span class="status">{{ $t('pages.recentTransactions.pendingStatus') }}</span>
          <span class="time">{{ tr.time }}</span>
        </div>
        <div class="holder">
          <span class="url">{{ tr.domain }}</span>
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
      pendingTipoArr: [],
      hash_ready: '',
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

      await browser.storage.local.get('pendingTip').then(async res => {
        this.pendingTipoArr = [];
        if (res.hasOwnProperty('pendingTip') && res.pendingTip.length) {
          this.newTip = true;
          if (this.newTip) {
            res.pendingTip.forEach(element => {
              element.amount = parseFloat(element.amount).toFixed(3);
              element.domain = element.domain;
              element.time = element.time;
              element.amountCurrency = parseFloat(this.current.currencyRate ? element.amount * this.current.currencyRate : element.amount).toFixed(3);

              this.pendingTipoArr.push(element);
            });
          }
          for (const k in this.pendingTipoArr) {
            const pendingTip = this.pendingTipoArr[k];
            Object.keys(transactions).forEach(async key => {
              const mined = await this.sdk.poll(pendingTip.hash);
              let transaction_ready = false;
              let hash_ready = '';
              if (mined && transactions[key].hash == pendingTip.hash) {
                transaction_ready = true;
                hash_ready = pendingTip.hash;
              }
              if (transaction_ready) {
                const del = res.pendingTip.filter(p => p.hash != hash_ready);
                browser.storage.local.set({ pendingTip: del });
                this.newTip = false;
                return this.$router.push({
                  name: 'success-tip',
                  params: {
                    amount: pendingTip.amount,
                    domain: pendingTip.domain,
                  },
                });
              }
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
      }, 5000);
    },
    getKeyByValue(object, value) {
      return Object.keys(object).find(key => object[key] === value);
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
