<template>
  <div v-if="transactions.pending.length">
    <ae-list-item v-for="tr in transactions.pending" :key="tr.hash" fill="neutral" class="list-item-transaction">
      <div class="holder">
        <span class="amount">
          {{ tr.amount }} {{ $t('pages.appVUE.aeid') }} <span class="text">( {{ tr.amountCurrency }} {{ currentCurrency }} )</span>
        </span>
        <span class="status">{{ $t('pages.recentTransactions.pendingStatus') }}</span>
        <span class="time">{{ txTime(tr.time) }}</span>
      </div>
      <div class="holder">
        <span class="url">{{ tr.domain }}</span>
        <span class="seeTransaction"><Eye /></span>
      </div>
    </ae-list-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import { formatDate } from '../../utils/helper';
import Eye from '../../../icons/eye.svg';


export default {
  components: {
    Eye,
  },
  computed: {
    ...mapGetters(['transactions', 'currentCurrency'])
  },
  data() {
    return {
      checkMined: null,
    };
  },
  created() {
    this.$store.dispatch('getPendingTxs');
    this.checkMined = setInterval(() => this.$store.dispatch('checkPendingTxMined'), 2500);
  },
  methods: {
    txTime(time) {
      return formatDate(time);
    }
  },
  beforeDestroy() {
    clearInterval(this.checkMined);
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

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
      color: $accent-color;
      font-size: 12px;
      text-align: left;
    }

    .time {
      color: $text-color !important;
      font-size: 12px;
    }

    .amount {
      color: $secondary-color !important;
      font-size: 14px;
    }

    .status {
      color: $text-color !important;
      font-size:14px;
    }
  }
}
</style>
