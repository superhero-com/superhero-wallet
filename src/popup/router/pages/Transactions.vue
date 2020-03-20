<template>
  <div class="popup">
    <AccountInfo />
    <BalanceInfo />
    <TransactionFilters @filtrate="filtrate" />
    <ae-list class="allTransactions">
      <div class="date" v-if="transactions.pending.length">{{ $t('pages.recentTransactions.pendingStatus') }}</div>
      <PendingTxs />
      <TransactionItem v-for="transaction in t_transactions" v-bind:key="transaction.id" :transactionData="transaction"></TransactionItem>
    </ae-list>
    <div v-if="!t_transactions.length && !loading">
      <p>{{ $t('pages.transactions.noTransactions') }}</p>
    </div>
    <div class="newTx" @click="mergeNewTransactions" v-if="newTransactions != 0">
      <span class="newTxCount">{{ newTransactions }}</span> {{ $t('pages.transactions.newTransactions') }}
    </div>
    <Loader size="small" :loading="loading" v-bind="{ content: '' }"></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval } from 'timers';
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import TransactionFilters from '../components/TransactionFilters';
import PendingTxs from '../components/PendingTxs';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    TransactionFilters,
    PendingTxs,
  },
  props: [''],
  data() {
    return {
      transactionsType: 'all',
      allTransactions: [],
      loading: true,
      page: 1,
      limit: 100,
      showMoreBtn: true,
      totalTransactions: 0,
      currentCount: 0,
      groupedTransactions: {},
      polling: null,
      newTransactions: 0,
      newTr: [],
      openFilter: false,
      upadateInterval: null,
      type: '',
      dateType: '',
    };
  },
  computed: {
    ...mapGetters(['account', 'transactions', 'current']),
    showMore() {
      return this.currentCount + 1 <= this.totalTransactions;
    },
    publicKey() {
      return this.account.publicKey;
    },
    watchToken() {
      return this.current.token;
    },
    t_transactions() {
      switch (this.type) {
        case 'date':
          if (this.dateType === 'recent') {
            return this.transactions.all.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
          }
          if (this.dateType === 'oldest') {
            return this.transactions.all.slice().sort((a, b) => new Date(a.time) - new Date(b.time));
          }
          break;
        case 'sent':
          return this.transactions.all.filter(tr => tr.tx.caller_id !== 'undefined' && tr.tx.type === 'ContractCallTx' && tr.tx.caller_id === this.publicKey);
        case 'received':
          return this.transactions.all.filter(tr => tr.tx.recipient_id !== 'undefined' && tr.tx.type === 'ContractCallTx' && tr.tx.recipient_id === this.publicKey);
        case 'topups':
          return this.transactions.all.filter(tr => tr.tx.recipient_id !== 'undefined' && tr.tx.type === 'SpendTx' && tr.tx.recipient_id === this.publicKey);
        case 'withdrawals':
          return this.transactions.all.filter(tr => tr.tx.sender_id !== 'undefined' && tr.tx.type === 'SpendTx' && tr.tx.sender_id === this.publicKey);
        case 'all':
          return this.transactions.all;
        default:
          return this.transactions.all;
      }
      return this.transactions.all;
    },
  },
  created() {
    this.getTotalTransactions();
    this.getTransactions('load');
    this.pollData();
    this.page = this.getPage();
  },
  methods: {
    async filtrate(type, dateType) {
      this.type = type;
      this.dateType = dateType;
    },
    getPage() {
      return this.transactions.all.length === 0 ? 1 : Math.ceil(this.transactions.all.length / this.limit);
    },
    pollData() {
      this.polling = setInterval(() => {
        this.getTransactions('new');
      }, 5000);
    },
    getTransactions(type, limit = this.limit) {
      if (this.current.token === 0) {
        if (type === 'load') {
          const transactions = this.$store.dispatch('getTransactionsByPublicKey', { publicKey: this.account.publicKey, page: this.page, limit });
          transactions.then(res => {
            if (res.length !== 0) {
              const newTrans = res.filter(tr => {
                if (!this.transactions.all.find(t => t.hash === tr.hash)) return tr;
                return null;
              });
              this.$store.dispatch('updateAllTransactions', { new: false, transactions: newTrans });
            } else {
              this.showMoreBtn = false;
            }
            this.loading = false;
          });
        } else if (type === 'new') {
          const transactions = this.$store.dispatch('getTransactionsByPublicKey', { publicKey: this.account.publicKey, limit });
          transactions.then(res => {
            const newTrans = res.filter(tr => {
              if (!this.transactions.all.find(t => t.hash === tr.hash)) return tr;
              return null;
            });
            newTrans.forEach(element => {
              if (typeof this.newTr.find(tr => tr.hash === element.hash) === 'undefined') {
                this.newTr.unshift(element);
                this.newTransactions += 1;
              }
            });
          });
        }
      }
    },
    async getTotalTransactions() {
      const transactions = await this.$store.dispatch('getTransactionsByPublicKey', { publicKey: this.account.publicKey, param: 'count' });
      this.totalTransactions = transactions.count;
    },
    async mergeNewTransactions() {
      await this.$store.dispatch('updateAllTransactions', { new: true, transactions: this.newTr });
      this.newTr = [];
      this.newTransactions = 0;
      this.getTotalTransactions();
    },
    loadMore() {
      this.mergeNewTransactions().then(() => {
        this.page += 1;
        this.getTransactions('load');
      });
    },
  },
  beforeDestroy() {
    window.clearTimeout(this.polling);
    window.clearTimeout(this.upadateInterval);
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.date {
  background: $button-color;
  padding: 0.5rem 1rem;
  color: $white-color;
  text-transform: uppercase;
  font-size: 0.9rem;
  font-family: monospace;
}
.actions {
  width: 50%;
  margin-top: 5px;
}
.newTx {
  position: fixed;
  bottom: 2%;
  left: 50%;
  -ms-transform: translateX(-50%);
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  background: $filters-bg;
  color: $white-color;
  padding: 0.7rem 1rem;
  text-align: center;
  cursor: pointer;
  width: 100%;
}
.newTxCount {
  background: $white-color;
  border-radius: 50%;
  color: $black-color;
  padding: 0.1rem.5rem;
  line-height: 3px;
  font-size: 0.9rem;
  font-weight: bold;
  font-family: monospace;
}
.filterModal .ae-dropdown-button {
  width: 90px;
}
.typeTx .ae-dropdown-button {
  width: 90px !important;
}
.filters h4 {
  margin-top: 0 !important;
  margin-bottom: 5px;
}
.w-100 {
  width: 100%;
}
.filtersOpen {
  width: 32%;
}
.filters li:first-child {
  border-top: none;
}
.filterButtons {
  margin-top: 15px;
}
.filterButtons .ae-button {
  padding: 0 1rem !important;
  height: 45px !important;
}
.filtersBtn {
  margin: 0;
  height: auto !important;
  padding: 0.7rem 1rem !important;
}
.popup {
  padding: 0;
}
.popupPadding {
  padding: 4px 14px;
}
</style>
