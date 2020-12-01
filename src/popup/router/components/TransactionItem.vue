<template>
  <div class="transaction-item">
    <div>
      <div class="status"><TokenAmount data-cy="amount" :amount="txAmount" /> {{ status }}</div>
      <span data-cy="time">{{ transaction.microTime | formatDate }}</span>
    </div>
    <div class="details">
      <button v-if="tipUrl" class="url" @click="openUrl(tipUrl, true)">{{ tipUrl }}</button>
      <span v-else-if="topup || withdraw" class="address">
        {{ topup ? transaction.tx.senderId : transaction.tx.recipientId }}
      </span>
      <span v-else>
        {{ transactionType }}
      </span>
      <button
        @click="openUrl(`${activeNetwork.explorerUrl}/transactions/${transaction.hash}`, true)"
      >
        <img src="../../../icons/eye.png" />
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { aettosToAe } from '../../utils/helper';
import { formatDate } from '../../utils';
import TokenAmount from './TokenAmount';
import openUrl from '../../utils/openUrl';

export default {
  components: { TokenAmount },
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  filters: {
    formatDate,
  },
  computed: {
    ...mapGetters(['account', 'activeNetwork']),
    status() {
      if (
        ['senderId', 'accountId', 'ownerId', 'callerId']
          .map((key) => this.transaction.tx[key])
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
      return +aettosToAe(+amount + fee);
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
  methods: {
    openUrl,
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.transaction-item {
  padding: 10px 0;
  border-color: $bg-color;
  border-top: 1px solid $tx-border-color;

  > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 19px;
    color: $text-color;
    font-size: 12px;
    font-weight: 500;

    &.details {
      line-height: 16px;
      font-weight: 400;
    }

    .status {
      font-size: 14px;
      color: $white-color;
    }

    button {
      border: none;
      outline: none;
      background: none;
      font: inherit;
      color: inherit;
      padding: 0;
      cursor: pointer;
    }

    .url {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .address {
      font-size: 9px;
      letter-spacing: -0.1px;
    }
  }
}
</style>
