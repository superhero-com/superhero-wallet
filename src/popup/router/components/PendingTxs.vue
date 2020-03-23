<template>
  <div v-if="transactions.pending.length" data-cy="pending-txs">
    <ae-list-item v-for="tr in transactions.pending" :key="tr.hash" fill="neutral" class="list-item-transaction">
      <div class="holder">
        <span class="amount" data-cy="amount">
          {{ tr.amount }} {{ $t('pages.appVUE.aeid') }} <span class="text">( {{ tr.amountCurrency }} {{ currentCurrency }} )</span>
        </span>
        <span class="status" data-cy="status">{{ $t('pages.recentTransactions.pendingStatus') }}</span>
        <span class="time" data-cy="time">{{ tr.time | formatDate }}</span>
      </div>
      <div class="holder">
        <span class="url" data-cy="url">{{ tr.domain }}</span>
        <span class="seeTransaction"><Eye /></span>
      </div>
    </ae-list-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import { formatDate } from '../../utils';
import Eye from '../../../icons/eye.svg?vue-component';

export default {
  components: {
    Eye,
  },
  computed: mapGetters(['transactions', 'currentCurrency']),
  filters: { formatDate },
  created() {
    this.$store.dispatch('getPendingTxs');
    const checkMined = setInterval(() => this.checkPendingTxMined(), 2500);
    this.$once('hook:destroyed', () => clearInterval(checkMined));
  },
  methods: {
    async checkPendingTxMined() {
      const { pendingTxs = [] } = await browser.storage.local.get('pendingTxs');
      await Promise.all(
        pendingTxs.map(async ({ hash, type, amount, domain }) => {
          const mined = await this.$store.state.sdk.poll(hash);
          if (!mined) return;
          const pending = pendingTxs.filter(p => p.hash !== hash);
          await browser.storage.local.set({ pendingTxs: pending });
          this.$store.commit('SET_PENDING_TXS', pending);
          if (type === 'tip') this.$router.push({ name: 'success-tip', params: { amount, domain } });
          if (type === 'spend') this.$router.push({ name: 'send', params: { redirectstep: 3, successtx: mined } });
        })
      );
    },
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
      font-size: 14px;
    }
  }
}
</style>
