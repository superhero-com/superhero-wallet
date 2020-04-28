<template>
  <li class="list-item-transaction">
    <div class="holder">
      <span class="amount">
        <span data-cy="amount">{{ txAmount }}</span>
        {{ $t('pages.appVUE.aeid') }}
        <span class="text" data-cy="currency-amount">
          ({{ txAmountToCurrency }} {{ current.currency.toUpperCase() }})
        </span>
      </span>
      <span class="status">{{ status }}</span>
      <span class="time" data-cy="time">{{ transaction.time | formatDate }}</span>
    </div>
    <div class="holder tx-info">
      <span v-if="tipUrl" class="url" @click="visitTipUrl">{{ tipUrl }}</span>
      <span v-else-if="topup" class="address">
        {{ transaction.tx.sender_id }}
      </span>
      <span v-else-if="withdraw" class="address">
        {{ transaction.tx.recipient_id }}
      </span>
      <span class="seeTransaction" @click="seeTx()">
        <img src="../../../icons/eye.png" />
      </span>
    </div>
  </li>
</template>

<script>
import { mapGetters } from 'vuex';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { aettosToAe } from '../../utils/helper';
import { formatDate } from '../../utils';
import openUrl from '../../utils/openUrl';

export default {
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  data: () => ({ tip: null }),
  filters: { formatDate },
  async created() {
    if (!this.transaction.pending) {
      await this.$watchUntilTruly(() => this.sdk);
      this.getEventData();
    }
  },
  computed: {
    ...mapGetters(['account', 'sdk', 'current', 'network']),
    status() {
      if (
        this.transaction.tx.sender_id === this.account.publicKey ||
        this.transaction.tx.account_id === this.account.publicKey ||
        this.transaction.tx.owner_id === this.account.publicKey ||
        this.transaction.tx.caller_id === this.account.publicKey
      ) {
        return this.$t('pages.transactions.sent');
      }
      if (this.transaction.pending) {
        return this.$t('pages.transactions.pending');
      }
      return this.$t('pages.transactions.received');
    },
    txAmount() {
      const amount = this.transaction.tx.amount || this.transaction.tx.name_fee || 0;
      const fee = this.transaction.tx.fee || 0;
      return (+aettosToAe(amount + fee)).toFixed(2);
    },
    txAmountToCurrency() {
      const amount = this.transaction.tx.amount || this.transaction.tx.name_fee || 0;
      const fee = this.transaction.tx.fee || 0;
      const txamount = aettosToAe(amount + fee);
      return (txamount * this.current.currencyRate).toFixed(2);
    },
    tipUrl() {
      return this.transaction.tipUrl ? this.transaction.tipUrl : this.tip;
    },
    topup() {
      return (
        this.transaction.tx.type === 'SpendTx' &&
        this.transaction.tx.recipient_id === this.account.publicKey
      );
    },
    withdraw() {
      return (
        this.transaction.tx.type === 'SpendTx' &&
        this.transaction.tx.sender_id === this.account.publicKey
      );
    },
  },
  methods: {
    async getEventData() {
      const { log } = await this.sdk.tx(this.transaction.hash, true);
      if (log && log.length) {
        this.tip = decode(log[0].data).toString();
      }
    },
    visitTipUrl() {
      if (this.tipUrl) {
        openUrl(this.tipUrl);
      }
    },
    seeTx() {
      openUrl(
        `${this.network[this.current.network].explorerUrl}/transactions/${this.transaction.hash}`,
      );
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.list-item-transaction {
  display: block;
  padding: 10px 0;
  border-color: $bg-color;
  text-decoration: none;
  list-style: none;
  cursor: default;
  border-top: 1px solid $tx-border-color !important;

  .holder {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    line-height: 19px;
    font-weight: 500;

    &.tx-info {
      line-height: 16px;
      font-weight: 400;
    }

    .url,
    .address {
      display: inline-block;
      white-space: nowrap;
      overflow: hidden !important;
      text-overflow: ellipsis;
      color: $text-color;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
      margin-right: 10px;
    }

    .address {
      font-size: 9px;
      letter-spacing: -0.1px;
    }

    .seeTransaction {
      margin-left: auto;
      cursor: pointer;
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

    .text {
      color: $white-color !important;
    }

    .status {
      color: $white-color !important;
      margin-left: 4px;
      margin-right: auto;
    }
  }
}
</style>
