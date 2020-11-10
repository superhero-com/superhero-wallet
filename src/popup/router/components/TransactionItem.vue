<template>
  <li class="list-item-transaction">
    <div class="holder">
      <span class="amount">
        <span data-cy="amount">{{ txAmount }}</span>
        {{ $t('pages.appVUE.aeid') }}
        <span class="text" data-cy="currency-amount">
          <!--eslint-disable vue-i18n/no-raw-text-->
          ({{ formatCurrency(txAmountToCurrency) }})
          <!--eslint-enable vue-i18n/no-raw-text-->
        </span>
      </span>
      <span class="status">{{ status }}</span>
      <span class="time" data-cy="time">{{ transaction.microTime | formatDate }}</span>
    </div>
    <div class="holder tx-info">
      <span v-if="tipUrl" class="url" @click="tipUrl && openUrl(tipUrl, true)">{{ tipUrl }}</span>
      <span v-else-if="topup" class="address">
        {{ transaction.tx.senderId }}
      </span>
      <span v-else-if="withdraw" class="address">
        {{ transaction.tx.recipientId }}
      </span>
      <span v-else class="tx-type">
        {{ transactionType }}
      </span>
      <span
        class="seeTransaction"
        @click="openUrl(`${activeNetwork.explorerUrl}/transactions/${transaction.hash}`, true)"
      >
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
  data: () => ({
    openUrl,
  }),
  filters: { formatDate },
  computed: {
    ...mapGetters(['account', 'activeNetwork', 'formatCurrency', 'currentCurrencyRate']),
    status() {
      if (
        ['senderId', 'accountId', 'ownerId', 'callerId']
          .map(key => this.transaction.tx[key])
          .includes(this.account.publicKey)
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
      return (+aettosToAe(+amount + fee)).toFixed(2);
    },
    txAmountToCurrency() {
      const amount = this.transaction.tx.amount || this.transaction.tx.name_fee || 0;
      const fee = this.transaction.tx.fee || 0;
      const txamount = +aettosToAe(+amount + fee);
      return (txamount * this.currentCurrencyRate).toFixed(2);
    },
    tipUrl() {
      return (
        this.transaction.tipUrl ||
        this.transaction.url ||
        (!this.transaction.pending &&
          !this.transaction.claim &&
          this.transaction.tx.log?.[0] &&
          decode(this.transaction.tx.log[0].data).toString()) ||
        ''
      );
    },
    topup() {
      return (
        this.transaction.tx.type === 'SpendTx' &&
        this.transaction.tx.recipientId === this.account.publicKey
      );
    },
    withdraw() {
      return (
        this.transaction.tx.type === 'SpendTx' &&
        this.transaction.tx.senderId === this.account.publicKey
      );
    },
    transactionType() {
      return this.$t('transaction.type')[this.transaction.tx.type];
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
    .address,
    .tx-type {
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
